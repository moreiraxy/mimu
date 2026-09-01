import type { ClientComIdentidade } from "@/lib/supabase/identidade";
import type { CanalDaConversa } from "@/lib/mimu/guardas";
import {
  getGroq,
  DEFAULT_MODEL,
  MODELOS_RESERVA,
  deveTentarOutroModelo,
} from "@/lib/groq";
import { registrarEvento } from "@/lib/eventos";
import {
  buildMimuSystemPrompt,
  type DadosNegocioMimu,
  type MimuCard,
} from "@/lib/mimu-prompts";
import {
  calcularFaturamentoPrevisto,
  calcularFaturamentoRealizado,
  calcularFaturamentoSemanal,
  calcularProgressoMeta,
  calcularSaldoCaixa,
  calcularTopCategoriasDespesa,
} from "@/lib/calculations";
import { formatTime } from "@/lib/formatters";
import type { Agendamento, Empresa } from "@/types";
import type { Database, Json } from "@/types/database";

/**
 * A Mimu respondendo uma pergunta sobre o negócio, sem saber por onde a
 * pergunta chegou.
 *
 * Saiu de dentro de app/api/mimu/chat/route.ts para poder ser usada por mais
 * de um canal. A regra é a mesma de sempre, movida e não reescrita: o app e o
 * WhatsApp precisam rodar o MESMO código, não um código parecido. Duas cópias
 * da mesma conta divergem, e dado divergente entre canais é o pior defeito
 * possível num produto de gestão — a pessoa vê um faturamento no app, outro no
 * WhatsApp, e para de confiar nos dois.
 *
 * Nada aqui sabe o que é HTTP. A função devolve um resultado, e cada canal
 * traduz: a rota vira status code, o WhatsApp vira texto de mensagem.
 */

/*
 * Exige a marca de identidade, e não um client qualquer.
 *
 * É isto que impede alguém de passar `createServiceClient()` para cá — o que
 * desligaria o RLS e deixaria só os `.eq("empresa_id")` abaixo entre uma
 * cliente e o faturamento da outra. Ver lib/supabase/identidade.ts.
 */
type Supabase = ClientComIdentidade;

type AgendamentoComNomeCliente = Agendamento & {
  cliente: { nome: string } | null;
};

const MAX_MENSAGENS_HISTORICO = 20;

/**
 * O que pode dar errado, como código e não como frase pronta.
 *
 * O canal decide a redação. A rota HTTP responde 500 e um texto de tela; o
 * WhatsApp precisa de uma frase que caiba numa mensagem. Devolver texto pronto
 * daqui obrigaria os dois a falar igual, e eles não falam.
 */
export type MotivoFalha =
  | "dados_indisponiveis"
  | "historico_indisponivel"
  | "ia_indisponivel"
  | "nao_salvou";

export type ResultadoConsulta =
  | {
      ok: true;
      mensagemId: string;
      texto: string;
      card: MimuCard | null;
      criadaEm: string;
    }
  | { ok: false; motivo: MotivoFalha };

/**
 * A janela de dados que a Mimu enxerga: o começo do mês ou o começo da semana,
 * o que vier primeiro.
 *
 * Precisa cobrir os dois porque as perguntas cruzam os dois recortes — "quanto
 * vendi essa semana" numa segunda-feira dia 2 precisa de dados do mês passado.
 */
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
export function extrairCard(texto: string): {
  texto: string;
  card: MimuCard | null;
} {
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

/**
 * Os números do negócio que vão para o prompt.
 *
 * Todas as consultas filtram por `empresa_id`. O filtro fica aqui E o RLS
 * fica no banco: no app o `supabase` recebido carrega a sessão de quem
 * perguntou e o banco barra sozinho, e é assim que tem que continuar sendo em
 * qualquer canal novo. Um client de service role passado para cá desligaria o
 * RLS e deixaria só este `.eq()` entre uma cliente e o faturamento da outra.
 */
async function reunirDadosDoNegocio(
  supabase: Supabase,
  empresa: Empresa,
): Promise<DadosNegocioMimu | null> {
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
    return null;
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

  return {
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
}

/**
 * Pergunta ao modelo, caindo para o reserva se o principal sumir.
 *
 * O laço existe porque já aconteceu: a Groq aposentou o modelo e a Mimu ficou
 * muda para todo mundo, com o 502 morrendo no log do servidor.
 */
async function perguntarAoModelo(
  systemPrompt: string,
  mensagens: { role: string; content: string }[],
): Promise<string> {
  let ultimoErro: unknown = null;
  let resposta = null;

  for (const modelo of [DEFAULT_MODEL, ...MODELOS_RESERVA]) {
    try {
      resposta = await getGroq().chat.completions.create({
        model: modelo,
        max_tokens: 1000,
        messages: [
          { role: "system", content: systemPrompt },
          ...mensagens,
        ] as Parameters<
          ReturnType<typeof getGroq>["chat"]["completions"]["create"]
        >[0]["messages"],
      });
      if (modelo !== DEFAULT_MODEL) {
        console.error(
          `Modelo ${DEFAULT_MODEL} indisponível. Respondendo com ${modelo}. Troque o padrão em lib/groq.ts.`,
        );
      }
      break;
    } catch (err) {
      ultimoErro = err;
      if (!deveTentarOutroModelo(err)) throw err;
    }
  }

  if (!resposta) throw ultimoErro;
  return resposta.choices[0]?.message?.content ?? "";
}

/**
 * Responde uma pergunta sobre o negócio e guarda a resposta no histórico.
 *
 * O `supabase` que chega decide o que a Mimu enxerga: ele precisa carregar a
 * identidade de quem perguntou, para o RLS valer. Ver o comentário em
 * `reunirDadosDoNegocio`.
 */
export async function responderConsulta(
  supabase: Supabase,
  empresa: Empresa,
  /** Por onde a resposta vai sair. Só marca a linha; o histórico lido é o
      mesmo, de todos os canais — ver a migration do campo `canal`. */
  canal: CanalDaConversa = "app",
): Promise<ResultadoConsulta> {
  const dadosNegocio = await reunirDadosDoNegocio(supabase, empresa);
  if (!dadosNegocio) return { ok: false, motivo: "dados_indisponiveis" };

  const { data: historico, error: historicoError } = await supabase
    .from("conversas_mimu")
    .select("role, content")
    .eq("empresa_id", empresa.id)
    .order("created_at", { ascending: false })
    .limit(MAX_MENSAGENS_HISTORICO);

  if (historicoError || !historico) {
    return { ok: false, motivo: "historico_indisponivel" };
  }

  const mensagensParaIA = historico
    .slice()
    .reverse()
    .map((m) => ({ role: m.role, content: m.content }));

  let respostaTexto: string;
  try {
    respostaTexto = await perguntarAoModelo(
      buildMimuSystemPrompt(empresa, dadosNegocio),
      mensagensParaIA,
    );
  } catch (err) {
    console.error("Erro ao chamar a API da Groq:", err);
    // A Mimu já ficou muda por horas sem ninguém saber, porque a Groq
    // aposentou o modelo e o 502 morria no log. Aqui isso vira linha no
    // painel.
    await registrarEvento("mimu_falhou", {
      empresaId: empresa.id,
      detalhe: {
        modelo: DEFAULT_MODEL,
        motivo: err instanceof Error ? err.message : String(err),
        status: (err as { status?: number }).status ?? null,
      },
    });
    return { ok: false, motivo: "ia_indisponivel" };
  }

  const { texto: textoLimpo, card } = extrairCard(respostaTexto);

  const { data: mensagemSalva, error: insertAssistantError } = await supabase
    .from("conversas_mimu")
    .insert({
      empresa_id: empresa.id,
      role: "assistant",
      content: textoLimpo,
      metadata: card ? (JSON.parse(JSON.stringify({ card })) as Json) : null,
      canal,
    })
    .select("id, created_at")
    .single();

  if (insertAssistantError || !mensagemSalva) {
    return { ok: false, motivo: "nao_salvou" };
  }

  return {
    ok: true,
    mensagemId: mensagemSalva.id,
    texto: textoLimpo,
    card,
    criadaEm: mensagemSalva.created_at,
  };
}
