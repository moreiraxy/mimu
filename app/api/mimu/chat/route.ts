import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  classificarIntencao,
  identificarPendenciaRegistro,
} from "@/lib/mimu/classificacao";
import { comIdentidade } from "@/lib/supabase/identidade";
import {
  responderConsulta,
  extrairCard,
  type MotivoFalha,
} from "@/lib/mimu/consulta";
import { getGroq, DEFAULT_MODEL, MODELOS_RESERVA, deveTentarOutroModelo } from "@/lib/groq";
import { registrarEvento } from "@/lib/eventos";
import {
  MAX_CARACTERES_MENSAGEM,
  RESPOSTA_BLOQUEADA,
  excedeuLimiteDoChat,
  pareceInjecaoDePrompt,
  registrarBloqueio,
  registrarUsoDoChat,
  salvarMensagemDaUsuaria,
} from "@/lib/mimu/guardas";
import { registrar } from "@/lib/mimu/registro";
import { desfazerUltima, pediuParaDesfazer } from "@/lib/mimu/desfazer";
import {
  buildMimuClassificationPrompt,
  buildMimuSystemPrompt,
  extrairClassificacao,
  type ClassificacaoMimu,
  type RegistroPendente,
} from "@/lib/mimu-prompts";
import { verificarAcesso, RESPOSTA_SEM_ACESSO_NO_APP } from "@/lib/mimu/acesso";
import { consumirMensagemDaMimu } from "@/lib/mimu/cota";
import type { Empresa } from "@/types";
import type { Json } from "@/types/database";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const MAX_MENSAGENS_HISTORICO = 20;

function normalizarRegistro(classificacao: ClassificacaoMimu): RegistroPendente {
  const { tipo, dados } = classificacao;
  return {
    tipoRegistro: tipo!,
    valor: dados.valor,
    descricao: dados.descricao,
    cliente: dados.cliente,
    data: dados.data,
    horario: dados.horario,
    confirmado: false,
  };
}

/** Salva a resposta da Mimu (texto simples, sem card nem registro) e monta o retorno da rota. */
async function salvarRespostaSimples(
  supabase: Supabase,
  empresaId: string,
  conteudo: string,
) {
  const { data: mensagemSalva, error } = await supabase
    .from("conversas_mimu")
    .insert({
      empresa_id: empresaId,
      role: "assistant",
      content: conteudo,
      metadata: null,
    })
    .select("id, created_at")
    .single();

  if (error || !mensagemSalva) {
    return NextResponse.json(
      { error: "A Mimu respondeu, mas não consegui salvar a conversa." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id: mensagemSalva.id,
    content: conteudo,
    card: null,
    registro: null,
    createdAt: mensagemSalva.created_at,
  });
}

/**
 * Mensagem bloqueada por `pareceInjecaoDePrompt` — nunca chega à classificação nem
 * à conversa (nenhuma chamada à IA acontece). Registra a tentativa em
 * `alertas_mimu` pra a dona do negócio ver, e dispara push se ela tiver
 * inscrição ativa; nenhuma das duas coisas pode derrubar a resposta.
 */
async function responderBloqueado(
  supabase: Supabase,
  empresaId: string,
  mensagemOriginal: string,
) {
  // O registro e o aviso vivem em lib/mimu/guardas.ts, para o WhatsApp fazer
  // exatamente a mesma coisa — inclusive avisar a dona pelo app, que é por
  // onde ela vai ver.
  await registrarBloqueio(comIdentidade(supabase), empresaId, mensagemOriginal);
  return salvarRespostaSimples(supabase, empresaId, RESPOSTA_BLOQUEADA);
}

/** Mensagem de "registro" identificado: monta o card de confirmação sem gravar nada ainda. */
async function responderComRegistro(
  supabase: Supabase,
  empresaId: string,
  classificacao: ClassificacaoMimu,
) {
  const registro = normalizarRegistro(classificacao);
  const conteudo = "Entendi! Confirma pra mim:";

  const { data: mensagemSalva, error } = await supabase
    .from("conversas_mimu")
    .insert({
      empresa_id: empresaId,
      role: "assistant",
      content: conteudo,
      metadata: JSON.parse(JSON.stringify({ registro })) as Json,
    })
    .select("id, created_at")
    .single();

  if (error || !mensagemSalva) {
    return NextResponse.json(
      { error: "A Mimu entendeu, mas não consegui salvar a conversa." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id: mensagemSalva.id,
    content: conteudo,
    card: null,
    registro,
    createdAt: mensagemSalva.created_at,
  });
}

/** Fluxo conversacional completo (consulta / outro / classificação indisponível) — igual ao Comando 1. */
/**
 * Como cada falha do serviço soa nesta ponta.
 *
 * A tabela existe para o serviço não precisar saber o que é status HTTP: ele
 * devolve um motivo, e cada canal escreve do seu jeito. O WhatsApp tem a
 * própria, com frases que cabem numa mensagem.
 */
const RESPOSTA_DE_FALHA: Record<MotivoFalha, { status: number; error: string }> = {
  dados_indisponiveis: {
    status: 500,
    error: "Não consegui buscar os dados do negócio agora.",
  },
  historico_indisponivel: {
    status: 500,
    error: "Não consegui carregar o histórico da conversa.",
  },
  ia_indisponivel: {
    status: 502,
    error: "A Mimu não conseguiu responder agora. Tenta de novo em instantes.",
  },
  nao_salvou: {
    status: 500,
    error: "A Mimu respondeu, mas não consegui salvar a conversa.",
  },
};

/**
 * Adaptador HTTP sobre a Mimu.
 *
 * A regra mora em lib/mimu/consulta.ts, para o app e o WhatsApp rodarem o
 * mesmo código. O que sobra aqui é a tradução: resultado vira status code.
 */
async function responderConversa(supabase: Supabase, empresa: Empresa) {
  // `comIdentidade` declara o que já é verdade aqui: este client carrega a
  // sessão de quem fez a requisição, então o RLS vale.
  const resultado = await responderConsulta(comIdentidade(supabase), empresa);

  if (!resultado.ok) {
    const { status, error } = RESPOSTA_DE_FALHA[resultado.motivo];
    return NextResponse.json({ error }, { status });
  }

  return NextResponse.json({
    id: resultado.mensagemId,
    content: resultado.texto,
    card: resultado.card,
    registro: null,
    createdAt: resultado.criadaEm,
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const mensagem =
    typeof body?.message === "string" ? body.message.trim() : "";

  if (!mensagem) {
    return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  }

  // Teto de tamanho: sem isso, `message` podia vir com megabytes de texto e
  // seguir direto pro Groq (duas chamadas por mensagem). 2000 caracteres é
  // muito acima de qualquer frase real ("vendi uma escova por 120") e ainda
  // assim limita o custo por requisição.
  if (mensagem.length > MAX_CARACTERES_MENSAGEM) {
    return NextResponse.json(
      { error: "Essa mensagem é longa demais. Manda em partes menores?" },
      { status: 413 },
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Limite por usuária, checado ANTES de gravar a mensagem e antes de
  // qualquer chamada à IA — o custo está nas chamadas ao Groq, então
  // bloquear depois de gastar não adiantaria nada.
  if (await excedeuLimiteDoChat(user.id)) {
    return NextResponse.json(
      {
        error:
          "Você mandou muitas mensagens seguidas. Espera um pouquinho e tenta de novo.",
      },
      { status: 429 },
    );
  }
  await registrarUsoDoChat(user.id);

  const { data: empresa, error: empresaError } = await supabase
    .from("empresas")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (empresaError || !empresa) {
    return NextResponse.json(
      { error: "Não encontrei os dados do seu negócio." },
      { status: 404 },
    );
  }

  /*
   * O MESMO portão do WhatsApp: suspensão, módulo e cota do dia.
   *
   * Esta rota confiava só no middleware, que sabe de módulo mas não sabe de
   * cota — e a cota é o que existe agora entre o plano gratuito e a fatura da
   * Groq. Reaproveitar `verificarAcesso` em vez de reescrever a regra aqui é
   * o que garante que os dois canais parem no mesmo lugar: uma segunda cópia
   * divergiria no dia em que alguém mexesse numa só, e o canal esquecido
   * viraria a porta destrancada.
   *
   * Vem antes de salvar a mensagem: quem foi barrada não deve ficar com a
   * conversa gravada como se tivesse conversado.
   */
  const acesso = await verificarAcesso(comIdentidade(supabase), empresa.id);
  if (!acesso.liberado) {
    return NextResponse.json(
      { error: RESPOSTA_SEM_ACESSO_NO_APP[acesso.motivo] },
      { status: acesso.motivo === "cota_esgotada" ? 429 : 403 },
    );
  }
  await consumirMensagemDaMimu(empresa.id);

  const idDaMensagem = await salvarMensagemDaUsuaria(
    comIdentidade(supabase),
    empresa.id,
    mensagem,
  );

  if (!idDaMensagem) {
    return NextResponse.json(
      { error: "Não consegui salvar sua mensagem." },
      { status: 500 },
    );
  }

  // Bloqueia ANTES de qualquer chamada à IA — nem a classificação de
  // intenção roda com uma mensagem suspeita de prompt injection.
  if (pareceInjecaoDePrompt(mensagem)) {
    return responderBloqueado(supabase, empresa.id, mensagem);
  }

  /*
   * "DESFAZER" VEM ANTES DO CLASSIFICADOR, igual ao WhatsApp.
   *
   * É a outra metade da autonomia: a Mimu só pode gravar sozinha porque
   * desfazer é uma palavra. Duas razões para não passar pelo modelo — é de
   * graça (comparação de string) e é seguro: mandar "desfazer" para um
   * classificador abre a chance de ele entender outra coisa justamente na
   * mensagem que pedia para reverter.
   */
  if (pediuParaDesfazer(mensagem)) {
    const desfeita = await desfazerUltima(comIdentidade(supabase), empresa.id);
    const resposta = desfeita.ok
      ? `Pronto, desfiz: ${desfeita.oQueFoiDesfeito}`
      : desfeita.motivo === "nada_para_desfazer"
        ? "Não achei nada recente para desfazer. Se foi de mais de um dia atrás, dá para ajustar na tela."
        : "Não consegui desfazer agora. Tenta de novo em um minuto?";
    return salvarRespostaSimples(supabase, empresa.id, resposta);
  }

  const ehPosto = (empresa.modulos_ativos ?? []).includes("posto");

  const classificacao = await classificarIntencao(mensagem, ehPosto);

  if (classificacao?.intencao === "registro") {
    /*
     * NO POSTO, A MIMU GRAVA. Não pede confirmação.
     *
     * Pedido dela (19/10/2026): "dê autonomia para a IA fazer anotações, criar
     * coisa na agenda e tudo". Pelo WhatsApp já era assim desde o começo
     * (lib/mimu/registro.ts: grava primeiro, oferece desfazer depois); dentro
     * do app ela devolvia um cartão "Confirma pra mim:" e ficava esperando um
     * toque. Duas cabeças para a mesma frase, e a mais burocrática era a do
     * lugar onde ela está trabalhando.
     *
     * É O MESMO `registrar` DO WHATSAPP, de propósito: uma segunda cópia
     * divergiria no dia em que alguém mexesse numa só.
     *
     * E consertou um defeito que estava embaixo do pedido: pendência não tinha
     * caminho no app. "lembra de cobrar o Marcos" caía na pergunta genérica
     * ("recebeu um pagamento, pagou alguma coisa ou quer marcar um horário?"),
     * ou seja, o lembrete não era anotado E ela levava um "não entendi".
     *
     * A CONTA DE SALÃO FICA COMO ESTÁ. Lá o cartão de confirmação é o fluxo
     * conhecido de quem usa, e trocá-lo por escrita automática sem ninguém
     * pedir seria mudar o produto de outra pessoa.
     */
    if (ehPosto) {
      const feito = await registrar(
        comIdentidade(supabase),
        empresa.id,
        "app",
        idDaMensagem,
        classificacao,
      );

      if (feito.ok) {
        return salvarRespostaSimples(supabase, empresa.id, feito.recibo);
      }
      // Faltou dado ou o nome ficou ambíguo: a pergunta certa já vem pronta,
      // e nada foi gravado.
      if (feito.motivo === "incompleto" || feito.motivo === "ambiguo") {
        return salvarRespostaSimples(supabase, empresa.id, feito.pergunta);
      }
      // Falhou de verdade: cai no cartão de confirmação em vez de engolir o
      // que ela disse.
      return responderComRegistro(supabase, empresa.id, classificacao);
    }

    const pendencia = identificarPendenciaRegistro(classificacao);
    if (pendencia) {
      return salvarRespostaSimples(supabase, empresa.id, pendencia);
    }
    return responderComRegistro(supabase, empresa.id, classificacao);
  }

  return responderConversa(supabase, empresa);
}
