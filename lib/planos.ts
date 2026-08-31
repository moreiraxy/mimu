import type { ModuloAtivo } from "@/types";

// Constantes client-safe — não importam o SDK do Mercado Pago (server-only),
// pra poder ser usadas tanto nas telas de assinatura quanto nas rotas de API.

export type PlanoPago = "pro" | "premium";

/**
 * Todo plano que dá acesso, incluindo o gratuito e os nomes antigos.
 *
 * "basico" e "completo" são de contas criadas antes dos planos atuais. Não
 * são vendidos mais, mas continuam existindo no banco e precisam continuar
 * funcionando: quem pagou por eles não escolheu ser migrado.
 */
export type PlanoComAcesso = "free" | PlanoPago | "basico" | "completo";

/** O plano gratuito permanente. Ver a migration 20260829120000. */
export const PLANO_GRATUITO = "free" as const;

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

/**
 * O TETO de cada plano: quais módulos ele deixa ligar.
 *
 * É teto e não lista: o que a empresa realmente usa é a interseção disto com
 * o `modulos_ativos` que ela escolheu no onboarding. Uma conta Pro que nunca
 * ligou o estoque continua sem estoque — o plano dá direito, não liga sozinho.
 *
 * A distinção importa porque os dois já existiam separados e faziam coisas
 * diferentes: `modulos_ativos` é preferência da dona do negócio, e isto aqui é
 * o que ela comprou. Misturar os dois faria um upgrade apagar as escolhas dela,
 * ou uma escolha dela virar upgrade de graça.
 */
export const MODULOS_DO_PLANO: Record<PlanoComAcesso, readonly ModuloAtivo[]> = {
  /*
   * O gratuito fica com o caixa e nada mais.
   *
   * Registrar venda e ver o faturamento do mês é o que faz a Mimu valer a
   * pena abrir todo dia, e é o hábito que sustenta a conversão depois. Agenda,
   * clientes e estoque são o trabalho que a pessoa já faz de outro jeito — dá
   * para viver sem, e é por eles que se paga.
   *
   * A IA fica de fora por um motivo a mais que os outros: cada resposta da
   * Mimu custa dinheiro na Groq. Um plano gratuito com IA ilimitada é uma
   * conta que cresce com o número de pessoas que nunca vão pagar.
   */
  free: ["financeiro"],

  // Os pagos liberam tudo. A diferença entre Pro e Premium hoje é de preço e
  // de limites, não de módulo — quando passar a ser de módulo, é aqui que muda.
  pro: ["financeiro", "agenda", "clientes", "estoque", "ia"],
  premium: ["financeiro", "agenda", "clientes", "estoque", "ia"],

  // Herdados. Quem pagou por eles não pode perder nada numa mudança de
  // catálogo que não pediu.
  basico: ["financeiro", "agenda", "clientes", "estoque", "ia"],
  completo: ["financeiro", "agenda", "clientes", "estoque", "ia"],
};

/**
 * Até onde o histórico é visível, em meses. `null` é sem limite.
 *
 * O gratuito enxerga o mês corrente. Não é para castigar: é a diferença que
 * a pessoa sente exatamente quando a Mimu começou a valer para ela — no dia
 * em que quer comparar este mês com o passado.
 */
export const HISTORICO_EM_MESES: Record<PlanoComAcesso, number | null> = {
  free: 1,
  pro: null,
  premium: null,
  basico: null,
  completo: null,
};

/** true quando o plano é o gratuito — quem não paga e não vence. */
export function ehPlanoGratuito(plano: string | null | undefined): boolean {
  return plano === PLANO_GRATUITO;
}

/**
 * O que a conta pode usar de fato: o que ela escolheu, limitado ao que o
 * plano dela permite.
 *
 * Um plano desconhecido cai no gratuito, e não no completo. Se um dia
 * aparecer no banco um plano que este código não conhece — migration
 * aplicada pela metade, escrita manual no painel — o erro seguro é liberar
 * de menos: dá para reclamar e consertar. Liberar de mais só se descobre no
 * fim do mês, olhando a fatura da Groq.
 */
export function modulosLiberados(
  plano: string | null | undefined,
  modulosEscolhidos: readonly ModuloAtivo[],
): ModuloAtivo[] {
  const teto = MODULOS_DO_PLANO[plano as PlanoComAcesso] ?? MODULOS_DO_PLANO.free;
  return modulosEscolhidos.filter((modulo) => teto.includes(modulo));
}

/** true quando o módulo está liberado para a conta. */
export function moduloLiberado(
  plano: string | null | undefined,
  modulosEscolhidos: readonly ModuloAtivo[],
  modulo: ModuloAtivo,
): boolean {
  return modulosLiberados(plano, modulosEscolhidos).includes(modulo);
}

/**
 * Como o plano se chama na tela.
 *
 * Os pagos tiram o nome de PLANOS, que é a fonte do preço. O gratuito e os
 * herdados não estão lá — não são vendidos — e por isso vêm daqui.
 *
 * Plano desconhecido vira "Gratuito" pela mesma razão que `modulosLiberados`
 * cai no gratuito: na dúvida, prometer de menos.
 */
export function nomeDoPlano(plano: string | null | undefined): string {
  if (plano === "pro" || plano === "premium") return PLANOS[plano].nome;
  if (plano === "basico") return "Básico";
  if (plano === "completo") return "Completo";
  return "Gratuito";
}
