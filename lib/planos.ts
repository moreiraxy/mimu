// Constantes client-safe — não importam o SDK do Mercado Pago (server-only),
// pra poder ser usadas tanto nas telas de assinatura quanto nas rotas de API.

export type PlanoPago = "pro" | "premium";

/** De quanto em quanto tempo a cobrança se repete. */
export type Periodicidade = "mensal" | "anual";

/** Quantos meses cada periodicidade cobre, para calcular a próxima cobrança. */
export const MESES_POR_PERIODICIDADE: Record<Periodicidade, number> = {
  mensal: 1,
  anual: 12,
};

/**
 * Os planos que se paga, com o valor de cada um.
 *
 * O preço mora AQUI e as rotas de pagamento leem daqui pelo id do plano. O
 * cliente manda "pro" ou "premium", nunca um valor: aceitar um número vindo
 * do navegador deixaria qualquer pessoa assinar o Premium por um centavo
 * trocando o corpo da requisição.
 */
export const PLANOS: Record<
  PlanoPago,
  {
    nome: string;
    valorMensal: number;
    /**
     * Valor do ano inteiro. `null` significa que este plano ainda não é vendido
     * na modalidade anual.
     *
     * Um plano com `null` aqui simplesmente não é vendido no ano, e
     * `valorDoPlano` devolve null em vez de cair no mensal: venda anual que
     * vira mensal em silêncio cobra o valor errado e marca a renovação errada.
     */
    valorAnual: number | null;
  }
> = {
  pro: { nome: "Pro", valorMensal: 39, valorAnual: 399 },
  premium: { nome: "Premium", valorMensal: 199, valorAnual: 1990 },
};

/**
 * O que cobrar de um plano numa periodicidade, ou null se essa combinação não
 * é vendida.
 *
 * Devolver null em vez de cair no mensal é proposital: uma venda anual que
 * silenciosamente vira mensal cobra o valor errado e marca a renovação errada,
 * e ninguém descobre até o cliente reclamar.
 */
export function valorDoPlano(
  plano: PlanoPago,
  periodicidade: Periodicidade,
): number | null {
  return periodicidade === "anual"
    ? PLANOS[plano].valorAnual
    : PLANOS[plano].valorMensal;
}

/** Estreita uma string qualquer para uma periodicidade válida. */
export function periodicidadeValida(valor: unknown): Periodicidade | null {
  return valor === "mensal" || valor === "anual" ? valor : null;
}

/** Data da próxima cobrança a partir de hoje, respeitando a periodicidade. */
export function proximaCobrancaDe(periodicidade: Periodicidade): Date {
  const data = new Date();
  data.setMonth(data.getMonth() + MESES_POR_PERIODICIDADE[periodicidade]);
  return data;
}

/** Plano assumido quando nenhum foi escolhido. */
export const PLANO_PADRAO: PlanoPago = "pro";

/** Estreita uma string qualquer para um plano válido, ou devolve null. */
export function planoValido(valor: unknown): PlanoPago | null {
  return typeof valor === "string" && valor in PLANOS
    ? (valor as PlanoPago)
    : null;
}

/**
 * Preço do Pro. Mantido porque várias telas falam do preço de entrada da
 * Mimu ("R$ 39/mês") sem estar escolhendo plano nenhum.
 */
export const VALOR_MENSAL_MIMU = PLANOS.pro.valorMensal;
