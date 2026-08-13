import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getGroq, DEFAULT_MODEL } from "@/lib/groq";
import { excedeuLimite, registrarTentativa } from "@/lib/rate-limit";
import {
  buildAlertaMessage,
  buildMimuClassificationPrompt,
  buildMimuSystemPrompt,
  extrairClassificacao,
  urlParaAlerta,
  type AlertaMetadata,
  type ClassificacaoMimu,
  type DadosNegocioMimu,
  type MimuCard,
  type RegistroPendente,
} from "@/lib/mimu-prompts";
import { enviarPushParaEmpresa } from "@/lib/push";
import type { Agendamento, Empresa } from "@/types";
import {
  calcularFaturamentoPrevisto,
  calcularFaturamentoRealizado,
  calcularFaturamentoSemanal,
  calcularProgressoMeta,
  calcularSaldoCaixa,
  calcularTopCategoriasDespesa,
} from "@/lib/calculations";
import { formatTime } from "@/lib/formatters";
import type { Json } from "@/types/database";

type AgendamentoComNomeCliente = Agendamento & {
  cliente: { nome: string } | null;
};

type Supabase = ReturnType<typeof createClient>;

const MAX_MENSAGENS_HISTORICO = 20;
/** Teto de caracteres por mensagem — ver o uso em POST() pro porquê. */
const MAX_CARACTERES_MENSAGEM = 2000;

/**
 * Tentativas de extrair o prompt/instruções internas da Mimu ou de fazer
 * perguntas sobre a infraestrutura técnica por trás dela. Bloqueado ANTES de
 * qualquer chamada à IA — nem a classificação de intenção chega a rodar.
 */
const PALAVRAS_EXTRACAO_PROMPT = [
  "prompt",
  "instruções",
  "system",
  "ignore",
  "jailbreak",
  "dan",
  "finja",
  "você agora é",
  "esqueça",
  "nova personalidade",
  "sem restrições",
  "modo desenvolvedor",
  "act as",
];

const PALAVRAS_DADOS_TECNICOS = [
  "supabase",
  "groq",
  "llama",
  "api key",
  "banco de dados",
  "next.js",
  "token",
  "variável de ambiente",
];

/** true se a mensagem tenta manipular o comportamento da Mimu ou extrair detalhes técnicos da plataforma. */
function filtrarMensagem(mensagem: string): boolean {
  const texto = mensagem.toLowerCase();
  return [...PALAVRAS_EXTRACAO_PROMPT, ...PALAVRAS_DADOS_TECNICOS].some(
    (palavra) => texto.includes(palavra),
  );
}

/** Janela de busca que cobre "hoje", "esta semana" e "este mês" numa única query. */
function inicioDaJanela(): Date {
  const agora = new Date();
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const inicioSemana = new Date(agora);
  inicioSemana.setDate(agora.getDate() - agora.getDay());
  inicioSemana.setHours(0, 0, 0, 0);
  return inicioMes < inicioSemana ? inicioMes : inicioSemana;
}

/**
 * A Mimu pode anexar um bloco [CARD]{...}[/CARD] ao final da resposta quando
 * a pergunta é sobre um valor específico — extraímos e removemos da mensagem
 * exibida antes de salvar/retornar.
 */
function extrairCard(texto: string): { texto: string; card: MimuCard | null } {
  const match = texto.match(/\[CARD\]([\s\S]*?)\[\/CARD\]/);
  if (!match) return { texto: texto.trim(), card: null };

  let card: MimuCard | null = null;
  try {
    const bruto = JSON.parse(match[1]!);
    if (
      bruto &&
      typeof bruto.titulo === "string" &&
      typeof bruto.valor === "number"
    ) {
      card = {
        titulo: bruto.titulo,
        valor: bruto.valor,
        comparacaoLabel:
          typeof bruto.comparacaoLabel === "string"
            ? bruto.comparacaoLabel
            : undefined,
        valorComparacao:
          typeof bruto.valorComparacao === "number"
            ? bruto.valorComparacao
            : undefined,
        variacaoPercentual:
          typeof bruto.variacaoPercentual === "number"
            ? bruto.variacaoPercentual
            : undefined,
      };
    }
  } catch {
    card = null;
  }

  return { texto: texto.replace(match[0], "").trim(), card };
}

/** Passo 1: classifica a intenção da mensagem numa chamada curta e separada. */
async function classificarIntencao(
  mensagem: string,
): Promise<ClassificacaoMimu | null> {
  try {
    const resposta = await getGroq().chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: 300,
      messages: [
        { role: "system", content: buildMimuClassificationPrompt() },
        { role: "user", content: mensagem },
      ],
    });

    const texto = resposta.choices[0]?.message?.content ?? "";
    return extrairClassificacao(texto);
  } catch (err) {
    console.error("Erro ao classificar intenção da mensagem:", err);
    return null;
  }
}

/** Campos obrigatórios por tipo de registro; retorna a mensagem de "não entendi" ou null se está tudo certo. */
function identificarPendenciaRegistro(
  classificacao: ClassificacaoMimu,
): string | null {
  const { tipo, dados } = classificacao;

  if (tipo === "entrada" || tipo === "saida") {
    if (!dados.valor || dados.valor <= 0) {
      return tipo === "entrada"
        ? "Não entendi bem. Você quis dizer que recebeu um pagamento? Me conta de novo com mais detalhes, incluindo o valor."
        : "Não entendi bem. Você quis dizer que pagou alguma coisa? Me conta de novo com mais detalhes, incluindo o valor.";
    }
    return null;
  }

  if (tipo === "agendamento") {
    if (!dados.cliente && !dados.descricao) {
      return "Não entendi bem quem é o agendamento. Me conta de novo com o nome do cliente e o horário.";
    }
    if (!dados.horario) {
      return "Não entendi o horário do agendamento. Me conta de novo com o dia e a hora.";
    }
    return null;
  }

  return "Não entendi bem. Você quis dizer que recebeu um pagamento, pagou alguma coisa ou quer marcar um horário? Me conta de novo com mais detalhes.";
}

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
 * Mensagem bloqueada por `filtrarMensagem` — nunca chega à classificação nem
 * à conversa (nenhuma chamada à IA acontece). Registra a tentativa em
 * `alertas_mimu` pra a dona do negócio ver, e dispara push se ela tiver
 * inscrição ativa; nenhuma das duas coisas pode derrubar a resposta.
 */
async function responderBloqueado(
  supabase: Supabase,
  empresaId: string,
  mensagemOriginal: string,
) {
  const conteudo =
    "Estou aqui para te ajudar com o seu negócio. Pode me perguntar sobre suas vendas, agendamentos, clientes ou metas.";

  const metadata: AlertaMetadata = { trecho: mensagemOriginal.slice(0, 200) };
  const mensagemAlerta = buildAlertaMessage("tentativa_prompt_injection");

  const { data: alerta, error: alertaError } = await supabase
    .from("alertas_mimu")
    .insert({
      empresa_id: empresaId,
      tipo: "tentativa_prompt_injection",
      mensagem: mensagemAlerta,
      metadata: JSON.parse(JSON.stringify(metadata)) as Json,
    })
    .select("*")
    .single();

  if (alertaError) {
    console.error("Não consegui registrar tentativa de prompt injection:", alertaError);
  } else if (alerta) {
    await enviarPushParaEmpresa(supabase, empresaId, {
      title: "Mimu",
      body: mensagemAlerta,
      url: urlParaAlerta("tentativa_prompt_injection", metadata),
    });
  }

  return salvarRespostaSimples(supabase, empresaId, conteudo);
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
async function responderConversa(supabase: Supabase, empresa: Empresa) {
  const hoje = new Date();
  const hojeISO = hoje.toISOString().slice(0, 10);
  const amanha = new Date(hoje);
  amanha.setDate(amanha.getDate() + 1);
  const amanhaISO = amanha.toISOString().slice(0, 10);
  const fimJanelaAgenda = new Date(hoje);
  fimJanelaAgenda.setDate(fimJanelaAgenda.getDate() + 7);

  const [transacoesResult, agendamentosResult, clientesResult] =
    await Promise.all([
      supabase
        .from("transacoes")
        .select("*")
        .eq("empresa_id", empresa.id)
        .gte("data", inicioDaJanela().toISOString().slice(0, 10)),
      supabase
        .from("agendamentos")
        .select("*, cliente:clientes(nome)")
        .eq("empresa_id", empresa.id)
        .gte("data_hora", `${hojeISO}T00:00:00`)
        .lte("data_hora", fimJanelaAgenda.toISOString()),
      supabase
        .from("clientes")
        .select("nome, saldo_fiado")
        .eq("empresa_id", empresa.id)
        .gt("saldo_fiado", 0),
    ]);

  if (
    transacoesResult.error ||
    agendamentosResult.error ||
    clientesResult.error
  ) {
    return NextResponse.json(
      { error: "Não consegui buscar os dados do negócio agora." },
      { status: 500 },
    );
  }

  const transacoes = transacoesResult.data ?? [];
  const agendamentos = (agendamentosResult.data ??
    []) as unknown as AgendamentoComNomeCliente[];
  const clientesComFiado = clientesResult.data ?? [];
  const agendamentosHoje = agendamentos.filter(
    (a) => a.data_hora.slice(0, 10) === hojeISO,
  );
  const agendamentosAmanha = agendamentos.filter(
    (a) =>
      a.data_hora.slice(0, 10) === amanhaISO &&
      (a.status === "confirmado" || a.status === "pendente"),
  );

  const faturamentoMes = calcularFaturamentoRealizado(transacoes, "mes");

  const dadosNegocio: DadosNegocioMimu = {
    saldoCaixa: calcularSaldoCaixa(transacoes),
    faturamentoHojeRealizado: calcularFaturamentoRealizado(transacoes, "dia"),
    faturamentoHojePrevisto: calcularFaturamentoPrevisto(agendamentosHoje),
    metaMensal: empresa.meta_mensal,
    progressoMetaMensal: calcularProgressoMeta(
      faturamentoMes,
      empresa.meta_mensal ?? 0,
    ),
    agendamentosHoje: agendamentosHoje.length,
    clientesComFiado: clientesComFiado.map((c) => ({
      nome: c.nome,
      valor: Number(c.saldo_fiado),
    })),
    faturamentoSemana: calcularFaturamentoSemanal(transacoes, "atual"),
    faturamentoMes,
    topCategoriasDespesa: calcularTopCategoriasDespesa(transacoes),
    agendamentosAmanha: agendamentosAmanha.map((a) => ({
      cliente: a.cliente?.nome ?? "Cliente",
      servico: a.titulo,
      horario: formatTime(a.data_hora),
      valor: a.valor_previsto,
    })),
  };

  const { data: historico, error: historicoError } = await supabase
    .from("conversas_mimu")
    .select("role, content")
    .eq("empresa_id", empresa.id)
    .order("created_at", { ascending: false })
    .limit(MAX_MENSAGENS_HISTORICO);

  if (historicoError || !historico) {
    return NextResponse.json(
      { error: "Não consegui carregar o histórico da conversa." },
      { status: 500 },
    );
  }

  const mensagensParaIA = historico
    .slice()
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }));

  const systemPrompt = buildMimuSystemPrompt(empresa, dadosNegocio);

  let respostaTexto: string;
  try {
    const resposta = await getGroq().chat.completions.create({
      model: DEFAULT_MODEL,
      max_tokens: 1000,
      messages: [
        { role: "system", content: systemPrompt },
        ...mensagensParaIA,
      ],
    });

    respostaTexto = resposta.choices[0]?.message?.content ?? "";
  } catch (err) {
    console.error("Erro ao chamar a API da Groq:", err);
    return NextResponse.json(
      {
        error:
          "A Mimu não conseguiu responder agora. Tenta de novo em instantes.",
      },
      { status: 502 },
    );
  }

  const { texto: textoLimpo, card } = extrairCard(respostaTexto);

  const { data: mensagemSalva, error: insertAssistantError } = await supabase
    .from("conversas_mimu")
    .insert({
      empresa_id: empresa.id,
      role: "assistant",
      content: textoLimpo,
      metadata: card ? (JSON.parse(JSON.stringify({ card })) as Json) : null,
    })
    .select("id, created_at")
    .single();

  if (insertAssistantError || !mensagemSalva) {
    return NextResponse.json(
      { error: "A Mimu respondeu, mas não consegui salvar a conversa." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    id: mensagemSalva.id,
    content: textoLimpo,
    card,
    registro: null,
    createdAt: mensagemSalva.created_at,
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

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Limite por usuária, checado ANTES de gravar a mensagem e antes de
  // qualquer chamada à IA — o custo está nas chamadas ao Groq, então
  // bloquear depois de gastar não adiantaria nada.
  if (await excedeuLimite("chat_ia", user.id)) {
    return NextResponse.json(
      {
        error:
          "Você mandou muitas mensagens seguidas. Espera um pouquinho e tenta de novo.",
      },
      { status: 429 },
    );
  }
  await registrarTentativa("chat_ia", user.id);

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

  const { error: insertUserError } = await supabase
    .from("conversas_mimu")
    .insert({ empresa_id: empresa.id, role: "user", content: mensagem });

  if (insertUserError) {
    return NextResponse.json(
      { error: "Não consegui salvar sua mensagem." },
      { status: 500 },
    );
  }

  // Bloqueia ANTES de qualquer chamada à IA — nem a classificação de
  // intenção roda com uma mensagem suspeita de prompt injection.
  if (filtrarMensagem(mensagem)) {
    return responderBloqueado(supabase, empresa.id, mensagem);
  }

  const classificacao = await classificarIntencao(mensagem);

  if (classificacao?.intencao === "registro") {
    const pendencia = identificarPendenciaRegistro(classificacao);
    if (pendencia) {
      return salvarRespostaSimples(supabase, empresa.id, pendencia);
    }
    return responderComRegistro(supabase, empresa.id, classificacao);
  }

  return responderConversa(supabase, empresa);
}
