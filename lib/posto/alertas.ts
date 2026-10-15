import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TipoAlerta } from "@/types/database";
import type { Empresa } from "@/types";
import { dataDeHojeNoBrasil, inicioDoDiaNoBrasil } from "@/lib/datas";
import { estadoDaRotina, minutosAgoraNoBrasil, paraHora } from "@/lib/posto/rotina";
import { NUMEROS } from "@/lib/posto/numeros";

type Supabase = SupabaseClient<Database>;

/**
 * Os avisos do posto — o que ela esqueceria.
 *
 * Pergunta dela: "notificaçÕes?? elas estão programadas para irem de acordo
 * com os afazeres taferas agendas e lembretes??". Não estavam: os avisos que
 * existiam são de salão ("hoje você ainda não registrou venda", "estoque
 * baixo") e, numa conta sem salão, NENHUM deles dispara. O app pedia permissão
 * de notificação e nunca avisava nada.
 *
 * QUANDO ISTO RODA. Em dois momentos, os mesmos dos avisos antigos: quando ela
 * abre o app (hooks/useAlertasProativos) e na tarefa agendada das 17:00 de
 * Brasília (migration 20260815120000). Por isso "compromisso chegando" usa
 * uma janela de DUAS HORAS e não de 15 minutos: com o aplicativo fechado,
 * ninguém está medindo o relógio minuto a minuto, e um aviso de 15 minutos que
 * só nasce quando ela abre o app chegaria sempre tarde — ou, pior, chegaria
 * depois da reunião.
 *
 * UM AVISO POR TIPO, POR DIA. Isto é o que faltava e é o que ela sentiu:
 * "as notificações n estão funcionando, aaprecem quando elas querem". A
 * geração roda quando ela abre o app, a cada 30 minutos de app aberto, cada
 * vez que a aba volta ao foco e na tarefa agendada — e sem travessa o MESMO
 * aviso nascia de novo em cada uma dessas vezes. Parecia aleatório porque era:
 * o gatilho era o foco da aba, não o relógio do dia dela.
 *
 * O caminho do produto antigo já fazia isso (`jaAlertadoHoje` em
 * lib/alertas-proativos.ts) e eu não copiei a regra ao escrever este arquivo.
 *
 * `compromisso_perto` é a exceção: ele dedupe por COMPROMISSO, não por tipo —
 * duas reuniões no mesmo dia são dois avisos, e avisar de uma só porque a
 * outra já avisou seria perder a segunda.
 *
 * O QUE ESTE ARQUIVO NÃO FAZ: inventar número. Indicador sem anotação gera o
 * aviso "falta anotar", nunca um aviso sobre o valor — porque não há valor.
 */

export interface AlertaDoPosto {
  tipo: TipoAlerta;
  mensagem: string;
  metadata?: Record<string, unknown>;
}

/** Depois das 17h o dia está fechando: é quando cobrar fechamento faz sentido. */
const HORA_DE_FECHAR = 17 * 60;
/** O bloco do resumo começa 17:45. */
const HORA_DO_RESUMO = 17 * 60 + 45;
/** Janela de "compromisso chegando", em minutos. Ver o comentário do topo. */
const JANELA_COMPROMISSO = 120;

export async function checarAlertasDoPosto(
  supabase: Supabase,
  empresa: Empresa,
  agora: Date = new Date(),
): Promise<AlertaDoPosto[]> {
  const hoje = dataDeHojeNoBrasil(agora);
  const minutos = minutosAgoraNoBrasil(agora);
  const alertas: AlertaDoPosto[] = [];

  const [feitas, pendencias, numeros, agendamentos, resumo, jaHoje] =
    await Promise.all([
      supabase
        .from("posto_rotina_feita")
        .select("bloco")
        .eq("empresa_id", empresa.id)
        .eq("dia", hoje),
      supabase
        .from("posto_pendencias")
        .select("id, titulo, tipo, prazo, com_quem")
        .eq("empresa_id", empresa.id)
        .eq("status", "aberta"),
      supabase
        .from("posto_numeros")
        .select("chave")
        .eq("empresa_id", empresa.id)
        .eq("dia", hoje),
      supabase
        .from("agendamentos")
        .select("titulo, data_hora")
        .eq("empresa_id", empresa.id)
        .gte("data_hora", `${hoje}T00:00:00`)
        .lte("data_hora", `${hoje}T23:59:59`),
      supabase
        .from("posto_resumos")
        .select("enviado_em")
        .eq("empresa_id", empresa.id)
        .eq("dia", hoje)
        .maybeSingle(),
      // O que já foi avisado hoje. A janela é o DIA DE BRASÍLIA, não as
      // últimas 24h: `inicioDoDiaNoBrasil` existe justamente porque o
      // servidor em UTC vira o dia às 21h daqui (ver lib/datas.ts).
      supabase
        .from("alertas_mimu")
        .select("tipo, metadata")
        .eq("empresa_id", empresa.id)
        .gte("created_at", inicioDoDiaNoBrasil(agora).toISOString()),
    ]);

  // Leitura que falhou não vira aviso. Dizer "3 blocos atrasados" quando a
  // consulta quebrou é pior que ficar calado.
  if (feitas.error || pendencias.error) return [];

  /*
   * As chaves já avisadas hoje. Por tipo, exceto o compromisso, que é por
   * compromisso.
   */
  const avisado = new Set(
    (jaHoje.data ?? []).map((a) => {
      const meta = (a.metadata ?? {}) as { titulo?: string };
      return a.tipo === "compromisso_perto" && meta.titulo
        ? `compromisso_perto:${meta.titulo}`
        : a.tipo;
    }),
  );

  const rotina = estadoDaRotina(
    (feitas.data ?? []).map((l) => l.bloco),
    agora,
  );

  /*
   * ROTINA ATRASADA — um aviso só, com a contagem.
   *
   * Um aviso por bloco daria cinco notificações às 15h de um dia corrido, e
   * cinco notificações sobre a mesma coisa é o caminho mais curto para ela
   * desligar as notificações.
   */
  if (
    rotina.atrasados.length > 0 &&
    !rotina.antesDaJornada &&
    !avisado.has("bloco_atrasado")
  ) {
    const primeiro = rotina.atrasados[0]!;
    alertas.push({
      tipo: "bloco_atrasado",
      mensagem:
        rotina.atrasados.length === 1
          ? `Passou da hora: ${primeiro.label} (${paraHora(primeiro.inicio)}).`
          : `${rotina.atrasados.length} blocos passaram da hora. O primeiro é ${primeiro.label}, das ${paraHora(primeiro.inicio)}.`,
      metadata: { blocos: rotina.atrasados.map((b) => b.chave) },
    });
  }

  const abertas = pendencias.data ?? [];

  /*
   * PRAZO — vencido ou vencendo hoje. A comparação é de TEXTO, "AAAA-MM-DD"
   * contra "AAAA-MM-DD", e isso é de propósito: `new Date("2026-10-15")` é
   * meia-noite em UTC, que aqui ainda é dia 14 às 21h — um prazo apareceria
   * vencido um dia antes.
   */
  const vencendo = abertas.filter((p) => p.prazo && p.prazo <= hoje);
  if (vencendo.length > 0 && !avisado.has("prazo_hoje")) {
    const primeira = vencendo[0]!;
    alertas.push({
      tipo: "prazo_hoje",
      mensagem:
        vencendo.length === 1
          ? `Prazo hoje: ${primeira.titulo}${primeira.com_quem ? ` (${primeira.com_quem})` : ""}.`
          : `${vencendo.length} pendências com prazo hoje ou vencido. A primeira: ${primeira.titulo}.`,
      metadata: { ids: vencendo.map((p) => p.id) },
    });
  }

  /*
   * APROVAÇÃO PARADA — só no fim do dia.
   *
   * De manhã isto seria ruído: ela acabou de mandar. No fim do dia é a última
   * chance de puxar o gerente antes de o assunto dormir mais um dia, e cai
   * junto com o bloco do resumo, que é onde ela fala com ele.
   */
  const aprovacoes = abertas.filter((p) => p.tipo === "aprovacao");
  if (
    aprovacoes.length > 0 &&
    minutos >= HORA_DE_FECHAR &&
    !avisado.has("aprovacao_parada")
  ) {
    alertas.push({
      tipo: "aprovacao_parada",
      mensagem:
        aprovacoes.length === 1
          ? `Ainda depende do Dyego: ${aprovacoes[0]!.titulo}.`
          : `${aprovacoes.length} assuntos ainda dependem do Dyego. Vale entrar no resumo de hoje.`,
      metadata: { ids: aprovacoes.map((p) => p.id) },
    });
  }

  // COMPROMISSO CHEGANDO.
  const proximos = (agendamentos.data ?? [])
    .map((a) => ({ titulo: a.titulo, minutos: minutoNoBrasil(a.data_hora) }))
    .filter(
      (a) => a.minutos >= minutos && a.minutos - minutos <= JANELA_COMPROMISSO,
    )
    .sort((a, b) => a.minutos - b.minutos);

  const proximo = proximos.find(
    (p) => !avisado.has(`compromisso_perto:${p.titulo}`),
  );
  if (proximo) {
    alertas.push({
      tipo: "compromisso_perto",
      mensagem: `${proximo.titulo} às ${paraHora(proximo.minutos)}.`,
      // `titulo` entra no metadata porque é a chave de deduplicação do dia.
      metadata: { titulo: proximo.titulo, emMinutos: proximo.minutos - minutos },
    });
  }

  // RESUMO DO DIA.
  if (
    minutos >= HORA_DO_RESUMO &&
    !resumo.data?.enviado_em &&
    !avisado.has("resumo_pendente")
  ) {
    alertas.push({
      tipo: "resumo_pendente",
      mensagem:
        "Passou das 17:45 e o resumo do dia ainda não foi enviado. O posto monta com o que você marcou.",
    });
  }

  // INDICADORES NÃO ANOTADOS.
  const anotados = new Set((numeros.data ?? []).map((l) => l.chave));
  const diarios = NUMEROS.filter((n) => n.periodicidade === "diario");
  const faltando = diarios.filter((n) => !anotados.has(n.chave));
  if (
    minutos >= HORA_DE_FECHAR &&
    faltando.length > 0 &&
    !avisado.has("indicador_vazio")
  ) {
    alertas.push({
      tipo: "indicador_vazio",
      mensagem:
        faltando.length === diarios.length
          ? "Nenhum indicador do dia foi anotado ainda."
          : `Falta anotar: ${faltando.map((n) => n.label.toLowerCase()).join("; ")}.`,
      metadata: { chaves: faltando.map((n) => n.chave) },
    });
  }

  return alertas;
}

/**
 * O minuto do dia de um instante, no fuso de Brasília.
 *
 * Pelo `Intl`, e não por `getHours()`: no servidor em UTC, `getHours()` de uma
 * reunião às 15h de Brasília devolve 18 — e o aviso "chegando" nasceria três
 * horas fora de hora.
 */
function minutoNoBrasil(instante: string): number {
  const [hora, minuto] = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(new Date(instante))
    .split(":")
    .map(Number);
  return hora! * 60 + minuto!;
}

/** Para onde o toque no aviso leva. */
export function urlDoAlertaDoPosto(tipo: TipoAlerta): string | null {
  if (tipo === "compromisso_perto") return "/agenda";
  if (
    tipo === "bloco_atrasado" ||
    tipo === "prazo_hoje" ||
    tipo === "aprovacao_parada" ||
    tipo === "resumo_pendente" ||
    tipo === "indicador_vazio"
  ) {
    return "/posto";
  }
  return null;
}
