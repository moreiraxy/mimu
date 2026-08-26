import type { FormaPagamentoMP } from "@/types";
import type { Periodicidade, PlanoPago } from "@/lib/planos";

/**
 * Tradução do webhook da Cakto para a linguagem da Mimu.
 *
 * A Cakto é o checkout de fora: quem compra por ela nunca passou pelo
 * mimu.app, e a venda chega aqui antes de existir conta. Este arquivo só
 * interpreta o recado — quem cria conta, ativa assinatura e liga módulos é
 * `lib/compra-externa.ts`, que já atende também a venda manual do painel.
 *
 * Duas coisas do contrato da Cakto mandam no desenho e merecem estar escritas:
 *
 * 1. Não existe assinatura HMAC nem cabeçalho de autenticação. A validação é
 *    um campo `secret` DENTRO do corpo. Quem gera esse segredo é a própria
 *    Cakto, junto com o webhook — não somos nós que escolhemos, e ele não
 *    aparece em lugar nenhum da API deles. É mais fraco que o do Mercado
 *    Pago, e é o que há.
 *
 * 2. "A Cakto interpreta qualquer resposta do seu sistema como entregue com
 *    sucesso." Ou seja: ela NÃO reenvia. Devolver 500 não faz a notificação
 *    voltar — só apaga a venda. Por isso a rota grava o evento antes de
 *    processar e avisa os admins quando não consegue liberar: um erro aqui é
 *    definitivo, e a única rede de segurança é alguém ficar sabendo.
 *
 * Contrato conferido em 26/08/2026 na documentação oficial
 * (cakto-dece4a15.mintlify.app/webhooks) e nas ofertas reais da conta, lidas
 * pela API da Cakto.
 */

/** O corpo que a Cakto entrega. Só os campos que a Mimu de fato usa. */
export interface PayloadCakto {
  secret?: string;
  event?: string;
  data?: {
    /** Id do pedido. É a chave de idempotência de cada cobrança. */
    id?: string;
    refId?: string;
    status?: string;
    amount?: number;
    paymentMethod?: string;
    customer?: { name?: string | null; email?: string | null };
    offer?: { id?: string; name?: string; price?: number };
    product?: { name?: string; id?: string };
    subscription?: {
      id?: string;
      status?: string;
      /** Intervalo em DIAS entre as cobranças. 30 é mensal, 365 é anual. */
      recurrence_period?: number;
      next_payment_date?: string | null;
    };
  };
}

/**
 * As ofertas que existem hoje na conta da Cakto, lidas da API deles.
 *
 * O id da oferta é o que decide plano e periodicidade. Poderia ser deduzido do
 * preço, mas preço muda em promoção e cupom, e uma dedução errada libera o
 * plano errado sem ninguém perceber. O id não muda.
 *
 * PARA ADICIONAR UMA OFERTA NOVA: crie no painel da Cakto e acrescente uma
 * linha aqui com o id dela. Enquanto o id não estiver nesta lista, a venda
 * NÃO é liberada sozinha — ela vira aviso no painel admin para ser registrada
 * na mão. É de propósito: chutar o plano de quem pagou é pior que avisar.
 */
export const OFERTAS_CAKTO: Record<
  string,
  { plano: PlanoPago; periodicidade: Periodicidade; descricao: string }
> = {
  // Produto "Mimu" (012e219a-039c-419d-94b1-7cb605c801dd) — o das quatro ofertas.
  "3be97ok": { plano: "pro", periodicidade: "mensal", descricao: "Assinatura Mensal Basic — R$ 39,90" },
  tm8tk2y: { plano: "premium", periodicidade: "mensal", descricao: "Assinatura Premium — R$ 199" },
  "55pfecd": { plano: "pro", periodicidade: "anual", descricao: "Assinatura Anual Pro — R$ 399" },
  tjt4jns: { plano: "premium", periodicidade: "anual", descricao: "Assinatura Anual Premium — R$ 1.990" },
  // Houve um segundo produto "Mimu" duplicado (a215f8c7), com a oferta wqwuycp.
  // Removido da Cakto em 26/08/2026 sem nunca ter tido pedido nem visita no
  // checkout, e por isso a oferta dele não aparece aqui: ela não pode mais
  // gerar venda. Se por algum motivo aparecer, cai em "oferta desconhecida",
  // que avisa em vez de adivinhar.
};

/**
 * Formas de pagamento da Cakto na coluna da Mimu.
 *
 * `pix_auto` é o Pix recorrente, e cai em "pix" como qualquer outro. Cartão de
 * crédito e débito viram "cartao". O que não for reconhecido vira "cartao"
 * também: a coluna não aceita nulo e a forma exata é detalhe de relatório, não
 * de liberação de acesso.
 */
export function formaDePagamento(metodo: string | undefined): FormaPagamentoMP {
  if (!metodo) return "cartao";
  if (metodo.includes("pix")) return "pix";
  if (metodo.includes("boleto")) return "boleto";
  return "cartao";
}

/** Status da Cakto que significam dinheiro efetivamente recebido. */
const STATUS_PAGO = new Set(["paid", "authorized"]);

/**
 * O que a Mimu deve fazer com um recado da Cakto.
 *
 * "ignorar" não é fracasso: Pix gerado, boleto emitido e abandono de checkout
 * chegam pelo mesmo canal e não mexem em acesso nenhum.
 */
export type DecisaoCakto =
  | {
      acao: "liberar";
      plano: PlanoPago;
      periodicidade: Periodicidade;
      email: string;
      nomeNegocio: string | null;
      valor: number;
      formaPagamento: FormaPagamentoMP;
      pagamentoId: string;
      statusProvedor: string | null;
      /** Vem da própria Cakto. Vale mais que qualquer conta nossa de dias. */
      proximaCobranca: Date | null;
      renovacao: boolean;
    }
  | {
      acao: "reverter";
      tipo: "reembolso" | "chargeback";
      pagamentoId: string;
      statusProvedor: string | null;
    }
  | { acao: "ignorar"; motivo: string }
  | { acao: "avisar"; motivo: string; detalhe: Record<string, unknown> };

/** Converte a data que a Cakto manda, aceitando nulo e texto inválido. */
function dataOuNulo(valor: string | null | undefined): Date | null {
  if (!valor) return null;
  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * Lê o payload e decide. Não toca no banco nem na rede.
 *
 * Separado da rota de propósito: assim a decisão é testável com um payload de
 * exemplo, sem Supabase no caminho.
 */
export function interpretarEventoCakto(payload: PayloadCakto): DecisaoCakto {
  const evento = payload.event ?? "";
  const dados = payload.data ?? {};
  const pagamentoId = dados.id ?? null;

  /*
   * Reembolso e chargeback vêm primeiro porque não dependem de oferta
   * conhecida: o que revoga o acesso é o id do pagamento que já está gravado.
   * Uma venda liberada na mão, antes de a oferta existir no mapa, também
   * precisa poder ser revertida.
   */
  if (evento === "refund" || evento === "chargeback") {
    if (!pagamentoId) {
      return {
        acao: "avisar",
        motivo: "reversao_sem_id",
        detalhe: { evento },
      };
    }
    return {
      acao: "reverter",
      tipo: evento === "refund" ? "reembolso" : "chargeback",
      pagamentoId,
      statusProvedor: dados.status ?? evento,
    };
  }

  /*
   * Cancelamento NÃO corta o acesso, e isso é decisão de produto, não
   * esquecimento. Quem cancela no meio de um mês já pago tem direito ao mês
   * que pagou. Como a Cakto não vai mandar renovação, a data de próxima
   * cobrança chega ao fim sozinha e o middleware marca a assinatura como
   * vencida no dia certo. Cortar aqui seria tirar acesso pago.
   */
  if (evento === "subscription_canceled") {
    return { acao: "ignorar", motivo: "cancelamento_acesso_segue_ate_o_fim" };
  }

  // Renovação recusada e compra recusada não mudam acesso, mas são o aviso
  // mais antecipado que existe de que uma cliente está prestes a sumir.
  if (evento === "purchase_refused" || evento === "subscription_renewal_refused") {
    return {
      acao: "avisar",
      motivo: evento,
      detalhe: {
        email: dados.customer?.email ?? null,
        oferta: dados.offer?.name ?? null,
        status: dados.status ?? null,
      },
    };
  }

  // Sobram os que liberam acesso.
  if (evento !== "purchase_approved" && evento !== "subscription_renewed") {
    return { acao: "ignorar", motivo: evento || "evento_sem_nome" };
  }

  // A Cakto manda `purchase_approved` também quando o Pix ainda está só
  // gerado. Só status de dinheiro recebido libera.
  if (!STATUS_PAGO.has(dados.status ?? "")) {
    return { acao: "ignorar", motivo: `status_${dados.status ?? "ausente"}` };
  }

  const email = dados.customer?.email?.trim().toLowerCase();
  if (!email || !pagamentoId) {
    return {
      acao: "avisar",
      motivo: "venda_sem_email_ou_id",
      detalhe: { evento, temEmail: Boolean(email), temId: Boolean(pagamentoId) },
    };
  }

  const ofertaId = dados.offer?.id ?? "";
  const oferta = OFERTAS_CAKTO[ofertaId];

  /*
   * Oferta desconhecida: a venda não é liberada e vira aviso.
   *
   * O caminho é a promoção nova criada no painel da Cakto, que ninguém
   * lembrou de acrescentar em OFERTAS_CAKTO. Dá para adivinhar pelo preço, e
   * é justamente o que não se faz: adivinhar errado dá Premium a quem pagou
   * Pro, ou marca renovação anual numa compra mensal. Melhor a venda esperar
   * um registro manual — que existe no painel — do que entrar torta.
   */
  if (!oferta) {
    return {
      acao: "avisar",
      motivo: "oferta_desconhecida",
      detalhe: {
        ofertaId,
        ofertaNome: dados.offer?.name ?? null,
        email,
        valor: dados.amount ?? null,
        pagamentoId,
      },
    };
  }

  return {
    acao: "liberar",
    plano: oferta.plano,
    periodicidade: oferta.periodicidade,
    email,
    // A Cakto coleta o nome da pessoa, não o do negócio. É o melhor que há, e
    // a própria dona corrige em Minha Empresa quando entrar.
    nomeNegocio: dados.customer?.name?.trim() || null,
    valor: dados.amount ?? dados.offer?.price ?? 0,
    formaPagamento: formaDePagamento(dados.paymentMethod),
    pagamentoId,
    statusProvedor: dados.status ?? null,
    /*
     * A data da próxima cobrança vem da Cakto, não de uma conta nossa.
     *
     * `proximaCobrancaDe("anual")` soma doze meses a partir de agora e acerta
     * na maioria das vezes. Mas quem manda no calendário da assinatura é quem
     * cobra: dia de vencimento, dias de teste e tentativas de recobrança
     * deslocam a data, e aí o acesso acabaria antes ou depois do que a
     * cliente pagou. Quando a Cakto diz a data, é ela que vale.
     */
    proximaCobranca: dataOuNulo(dados.subscription?.next_payment_date),
    renovacao: evento === "subscription_renewed",
  };
}
