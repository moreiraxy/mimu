import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Empresa } from "@/types";
import { dataDeHojeNoBrasil } from "@/lib/datas";
import { estadoDaRotina } from "@/lib/posto/rotina";
import { resumirDinheiro } from "@/lib/posto/financas";
import type { ContextoDoPosto } from "@/lib/posto/prompt";
import type { Transacao } from "@/types";

type Supabase = SupabaseClient<Database>;

/**
 * Reúne o dia dela para a assistente — a versão servidor do que a tela do
 * posto mostra.
 *
 * MESMAS FONTES DA TELA, de propósito: a rotina marcada, as pendências
 * abertas, os indicadores do dia, os compromissos de hoje e de amanhã e o
 * dinheiro do mês. Se a assistente lesse outro lugar, ela e a tela
 * discordariam — e a pessoa teria que decidir em qual acreditar.
 *
 * O DIA É O DE BRASÍLIA. `dataDeHojeNoBrasil()` e não `toISOString()`: no
 * servidor em UTC, das 21h à meia-noite daqui, o segundo devolve AMANHÃ, e a
 * assistente responderia sobre o dia errado justamente no fim do expediente —
 * que é quando ela mais pergunta. É o mesmo defeito corrigido em
 * lib/mimu/registro.ts em 10/09/2026.
 */
export async function reunirContextoDoPosto(
  supabase: Supabase,
  empresa: Empresa,
  agora: Date = new Date(),
): Promise<ContextoDoPosto | null> {
  const hoje = dataDeHojeNoBrasil(agora);
  const amanhaDate = new Date(`${hoje}T12:00:00Z`);
  amanhaDate.setUTCDate(amanhaDate.getUTCDate() + 1);
  const amanha = dataDeHojeNoBrasil(amanhaDate);
  const primeiroDiaDoMes = `${hoje.slice(0, 7)}-01`;

  const [feitas, pendencias, numeros, agendamentos, transacoes, resumo] =
    await Promise.all([
      supabase
        .from("posto_rotina_feita")
        .select("bloco")
        .eq("empresa_id", empresa.id)
        .eq("dia", hoje),
      supabase
        .from("posto_pendencias")
        .select("*")
        .eq("empresa_id", empresa.id)
        .eq("status", "aberta")
        .order("urgente", { ascending: false })
        .order("prazo", { ascending: true, nullsFirst: false }),
      supabase
        .from("posto_numeros")
        .select("chave, valor")
        .eq("empresa_id", empresa.id)
        .eq("dia", hoje),
      supabase
        .from("agendamentos")
        .select("titulo, data_hora, clientes(nome)")
        .eq("empresa_id", empresa.id)
        .gte("data_hora", `${hoje}T00:00:00`)
        .lte("data_hora", `${amanha}T23:59:59`)
        .order("data_hora", { ascending: true }),
      supabase
        .from("transacoes")
        .select("*")
        .eq("empresa_id", empresa.id)
        .gte("data", primeiroDiaDoMes),
      supabase
        .from("posto_resumos")
        .select("enviado_em")
        .eq("empresa_id", empresa.id)
        .eq("dia", hoje)
        .maybeSingle(),
    ]);

  // Falha de leitura devolve null, e quem chama cai no "não consegui agora".
  // Responder com metade do dia seria pior: a assistente afirmaria que não há
  // nada atrasado porque a consulta falhou.
  if (feitas.error || pendencias.error || numeros.error || agendamentos.error) {
    return null;
  }

  const comHora = (linha: {
    titulo: string;
    data_hora: string;
    clientes?: { nome: string } | { nome: string }[] | null;
  }) => {
    const cliente = Array.isArray(linha.clientes)
      ? linha.clientes[0]
      : linha.clientes;
    return {
      horario: new Date(linha.data_hora).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/Sao_Paulo",
      }),
      titulo: linha.titulo,
      comQuem: cliente?.nome ?? null,
    };
  };

  const todos = (agendamentos.data ?? []) as unknown as {
    titulo: string;
    data_hora: string;
    clientes: { nome: string } | null;
  }[];

  const dinheiro = resumirDinheiro(
    (transacoes.data ?? []) as unknown as Transacao[],
  );

  return {
    rotina: estadoDaRotina(
      (feitas.data ?? []).map((l) => l.bloco),
      agora,
    ),
    pendencias: (pendencias.data ??
      []) as ContextoDoPosto["pendencias"],
    numeros: Object.fromEntries(
      (numeros.data ?? []).map((l) => [l.chave, Number(l.valor)]),
    ),
    compromissosHoje: todos
      .filter((a) => a.data_hora.startsWith(hoje))
      .map(comHora),
    compromissosAmanha: todos
      .filter((a) => a.data_hora.startsWith(amanha))
      .map(comHora),
    dinheiro: {
      entrou: dinheiro.entrou,
      saiu: dinheiro.saiu,
      sobrou: dinheiro.sobrou,
      porFonte: dinheiro.porFonte.map((f) => ({
        rotulo: f.rotulo,
        valor: f.valor,
      })),
    },
    dataTexto: new Date(`${hoje}T12:00:00Z`).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    }),
    resumoEnviado: Boolean(resumo.data?.enviado_em),
  };
}
