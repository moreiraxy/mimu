// Constantes client-safe — não importam o SDK do Mercado Pago (server-only),
// pra poder ser usadas tanto nas telas de assinatura quanto nas rotas de API.

export type PlanoPago = "pro" | "premium";

/**
 * Os planos que se paga, com o valor de cada um.
 *
 * O preço mora AQUI e as rotas de pagamento leem daqui pelo id do plano. O
 * cliente manda "pro" ou "premium", nunca um valor: aceitar um número vindo
 * do navegador deixaria qualquer pessoa assinar o Premium por um centavo
 * trocando o corpo da requisição.
 */
export const PLANOS: Record<PlanoPago, { nome: string; valorMensal: number }> = {
  pro: { nome: "Pro", valorMensal: 39 },
  premium: { nome: "Premium", valorMensal: 199 },
};

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
