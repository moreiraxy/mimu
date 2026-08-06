import type { TransacaoComCliente } from "@/types";

export const FILTROS = [
  "Todos",
  "Entradas",
  "Saídas",
  "Hoje",
  "Esta semana",
  "Este mês",
] as const;

export type FiltroTransacao = (typeof FILTROS)[number];

export function aplicarFiltro(
  transacoes: TransacaoComCliente[],
  filtro: FiltroTransacao,
): TransacaoComCliente[] {
  if (filtro === "Todos") return transacoes;
  if (filtro === "Entradas") return transacoes.filter((t) => t.tipo === "entrada");
  if (filtro === "Saídas") return transacoes.filter((t) => t.tipo === "saida");

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (filtro === "Hoje") {
    return transacoes.filter(
      (t) => new Date(`${t.data}T00:00:00`).getTime() === hoje.getTime(),
    );
  }

  if (filtro === "Esta semana") {
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    return transacoes.filter((t) => new Date(`${t.data}T00:00:00`) >= inicio);
  }

  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  return transacoes.filter((t) => new Date(`${t.data}T00:00:00`) >= inicioMes);
}

/** Categorias realmente usadas nas transações carregadas, em ordem alfabética. */
export function categoriasDisponiveis(
  transacoes: TransacaoComCliente[],
): string[] {
  const categorias = new Set(
    transacoes.map((t) => t.categoria).filter((c): c is string => Boolean(c)),
  );
  return Array.from(categorias).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function aplicarFiltroCategoria(
  transacoes: TransacaoComCliente[],
  categoria: string | null,
): TransacaoComCliente[] {
  if (!categoria) return transacoes;
  return transacoes.filter((t) => t.categoria === categoria);
}

export function agruparPorData(
  transacoes: TransacaoComCliente[],
): [string, TransacaoComCliente[]][] {
  const grupos = new Map<string, TransacaoComCliente[]>();
  for (const t of transacoes) {
    const lista = grupos.get(t.data) ?? [];
    lista.push(t);
    grupos.set(t.data, lista);
  }
  return Array.from(grupos.entries());
}
