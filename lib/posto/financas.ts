/**
 * O dinheiro dela, por FONTE e por destino.
 *
 * Reaproveita `transacoes` e `categorias`, que já existem, já têm tela de
 * lançamento, gráfico e RLS testada — inventar tabela nova aqui seria manter
 * dois financeiros. O que muda é a pergunta: o produto antigo perguntava
 * "quanto o salão faturou"; ela pergunta "quanto entrou do CRM, quanto entrou
 * do Dyego, quanto entrou de venda, e para onde foi".
 *
 * A fonte da entrada é a CATEGORIA da transação. As categorias dela foram
 * semeadas na migration 20261014190000 (CRM Fortis, Salário Dyego, Comissão de
 * venda, Fortis 360, Outra entrada) — não há coluna "fonte" nova, porque
 * categoria já é exatamente isso para uma entrada.
 */

import type { Transacao } from "@/types";

export interface LinhaDeDinheiro {
  rotulo: string;
  valor: number;
  /** Fatia do total, de 0 a 1. Para a barra na tela. */
  fatia: number;
}

export interface ResumoDoDinheiro {
  entrou: number;
  saiu: number;
  /** Entrou menos saiu NESTE período. Não é saldo de conta. */
  sobrou: number;
  porFonte: LinhaDeDinheiro[];
  porDestino: LinhaDeDinheiro[];
  lancamentos: number;
}

/**
 * Soma um recorte de datas já filtrado por quem chama.
 *
 * Recebe o período pronto em vez de descobrir "o mês atual" por dentro, por
 * duas razões. A primeira é o fuso: `new Date()` no servidor é UTC e vira o
 * dia às 21h de Brasília (ver lib/datas.ts). A segunda é que a mesma função
 * serve o mês, a semana e "este ano" sem cópia.
 *
 * O NOME IMPORTA. `sobrou` é entrada menos saída DO PERÍODO — não é o saldo da
 * conta dela. Chamar isso de saldo foi exatamente o defeito corrigido em
 * 10/09/2026, quando a Mimu dizia R$ 1.056,00 e o Financeiro, na tela ao lado,
 * mostrava R$ 20.531,00: os dois números certos, o rótulo mentindo.
 */
export function resumirDinheiro(transacoes: Transacao[]): ResumoDoDinheiro {
  let entrou = 0;
  let saiu = 0;
  const fontes = new Map<string, number>();
  const destinos = new Map<string, number>();

  for (const t of transacoes) {
    const valor = Number(t.valor);
    const rotulo = t.categoria ?? "Sem categoria";
    if (t.tipo === "entrada") {
      entrou += valor;
      fontes.set(rotulo, (fontes.get(rotulo) ?? 0) + valor);
    } else {
      saiu += valor;
      destinos.set(rotulo, (destinos.get(rotulo) ?? 0) + valor);
    }
  }

  return {
    entrou,
    saiu,
    sobrou: entrou - saiu,
    porFonte: ordenarComFatia(fontes, entrou),
    porDestino: ordenarComFatia(destinos, saiu),
    lancamentos: transacoes.length,
  };
}

function ordenarComFatia(
  mapa: Map<string, number>,
  total: number,
): LinhaDeDinheiro[] {
  return Array.from(mapa.entries())
    .map(([rotulo, valor]) => ({
      rotulo,
      valor,
      // Divisão por zero daria NaN e a barra desapareceria sem erro.
      fatia: total > 0 ? valor / total : 0,
    }))
    .sort((a, b) => b.valor - a.valor);
}

/**
 * As fontes de entrada dela, na ordem em que fazem sentido na tela.
 *
 * Existe para a tela poder mostrar "R$ 0,00 do Dyego este mês" — uma fonte que
 * não apareceu é informação, e um mapa montado só do que existe em
 * `transacoes` nunca mostraria isso. Os nomes batem com a semeadura da
 * migration; o que ela criar à mão depois aparece junto, pelo caminho normal.
 */
export const FONTES_ESPERADAS = [
  "CRM Fortis",
  "Salário Dyego",
  "Comissão de venda",
  "Fortis 360",
] as const;

/** Junta o que foi lançado com as fontes esperadas que ficaram em zero. */
export function fontesComZeros(porFonte: LinhaDeDinheiro[]): LinhaDeDinheiro[] {
  const vistas = new Set(porFonte.map((l) => l.rotulo));
  const zeradas = FONTES_ESPERADAS.filter((f) => !vistas.has(f)).map((f) => ({
    rotulo: f,
    valor: 0,
    fatia: 0,
  }));
  return [...porFonte, ...zeradas];
}
