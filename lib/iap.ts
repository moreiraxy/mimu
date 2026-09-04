import { ehAppIOSNoNavegador } from "@/lib/plataforma";
import type { PlanoPago, Periodicidade } from "@/lib/planos";

/**
 * A ponte entre a tela e o In-App Purchase do iOS.
 *
 * A página roda numa WKWebView e não enxerga o StoreKit: comprar pela Apple é
 * coisa de código nativo. Quem faz a compra é um plugin do Capacitor, escrito
 * em Swift, que se apresenta aqui neste objeto. Este arquivo é só o contrato
 * — o lado de cá.
 *
 * ENQUANTO O PLUGIN NÃO EXISTIR, `window.MimuIAP` é undefined, e é assim que
 * tem que ser: a tela pergunta se o caminho de compra existe antes de oferecer
 * o botão. Botão que não faz nada é pior do que botão nenhum, e num app de
 * assinatura é pior ainda — a pessoa toca em "assinar", nada acontece, e o que
 * ela conclui é que o produto está quebrado.
 *
 * OS ARGUMENTOS VÃO EM OBJETO, e não soltos. O proxy do `registerPlugin` do
 * Capacitor manda o PRIMEIRO argumento inteiro como o dicionário de options do
 * plugin, e o Swift lê `call.getString("produtoId")`. Passar a string crua
 * entrega um options que não é dicionário: `produtoId` chega nulo, o nativo
 * devolve `produto_ausente` e a tela trata como desistência. A compra nunca
 * abre, e ninguém vê erro nenhum.
 */
export interface PonteIAP {
  /**
   * Abre o fluxo de compra da Apple e resolve quando ele termina.
   *
   * O preço NÃO vai daqui: quem define é o App Store Connect, por produto.
   * Mandar valor do JavaScript seria a mesma falha que lib/planos.ts já evita
   * no checkout próprio — quem manda o preço manda o preço que quiser.
   */
  comprar(opcoes: { produtoId: string }): Promise<ResultadoCompra>;
  /**
   * O preço do produto, JÁ formatado pela Apple ("R$ 39,90", "US$ 7.99").
   *
   * Existe porque quem define o preço no iOS é o App Store Connect, por faixas
   * — e a faixa mais próxima de R$ 39 pode não ser R$ 39. Mostrar o valor da
   * nossa tabela e a Apple cobrar outro é anunciar um preço e cobrar outro:
   * quebra de confiança com a cliente, e reprovação na revisão.
   *
   * Vem formatado da Apple de propósito, e não como número: ela já sabe a
   * moeda e o formato da região de quem está olhando, e nós não.
   */
  precoFormatado(opcoes: { produtoId: string }): Promise<string | null>;
  /**
   * Recupera uma assinatura que a Apple já conhece.
   *
   * A App Store exige este caminho para qualquer app com compra não
   * consumível ou assinatura (diretriz 3.1.1): sem ele, quem trocou de
   * aparelho ou reinstalou perde o que pagou, e a revisão reprova.
   */
  restaurar(): Promise<ResultadoCompra>;
  /**
   * Leva para Ajustes → Assinaturas, onde a Apple deixa cancelar.
   *
   * É o único lugar onde uma assinatura comprada por IAP pode ser cancelada:
   * nós não temos essa permissão, nem por API.
   */
  abrirGerenciamento(): Promise<void>;
}

export interface ResultadoCompra {
  ok: boolean;
  /**
   * O `transactionId` da compra. Serve de recibo para o servidor conferir com
   * a Apple.
   *
   * O acesso NUNCA é liberado por este valor chegar aqui: o navegador é
   * território de quem usa o aparelho, e liberar por resposta de cliente é o
   * mesmo buraco que aceitar o preço vindo do navegador. Quem libera é a
   * conferência no servidor, contra a App Store Server API.
   */
  transactionId?: string;
  /** Motivo curto quando `ok` é falso — inclui a desistência da pessoa. */
  erro?: string;
}

declare global {
  interface Window {
    MimuIAP?: PonteIAP;
  }
}

/**
 * Os ids dos produtos no App Store Connect.
 *
 * Precisam ser criados lá com EXATAMENTE estas strings, e uma vez publicados
 * não mudam. O par plano+periodicidade vira um produto: a Apple não tem o
 * conceito de "mesmo plano cobrado de dois jeitos".
 */
export const PRODUTO_IAP: Record<PlanoPago, Record<Periodicidade, string>> = {
  pro: {
    mensal: "br.com.mimu.app.pro.mensal",
    anual: "br.com.mimu.app.pro.anual",
  },
  premium: {
    mensal: "br.com.mimu.app.premium.mensal",
    anual: "br.com.mimu.app.premium.anual",
  },
};

/** Por onde esta sessão consegue comprar, se é que consegue. */
export type CaminhoDeCompra = "web" | "iap" | "indisponivel";

/**
 * Onde a pessoa consegue assinar, daqui.
 *
 * "indisponivel" acontece num caso só, e é temporário por natureza: dentro do
 * app iOS antes do plugin nativo existir. A tela usa isso para não desenhar um
 * botão que não levaria a lugar nenhum — e o dia em que o plugin subir, o
 * botão aparece sozinho, sem mexer em nada aqui.
 */
export function caminhoDeCompra(): CaminhoDeCompra {
  if (!ehAppIOSNoNavegador()) return "web";
  return typeof window !== "undefined" && window.MimuIAP ? "iap" : "indisponivel";
}

/**
 * Leva para o cancelamento certo de acordo com quem cobrou.
 *
 * Devolve false quando não há caminho daqui — assinatura da Apple sem a ponte
 * nativa, por exemplo — para a tela dizer o que fazer em vez de fingir que
 * resolveu.
 */
export async function abrirGerenciamentoDaApple(): Promise<boolean> {
  if (typeof window === "undefined" || !window.MimuIAP) return false;
  await window.MimuIAP.abrirGerenciamento();
  return true;
}
