import "server-only";
import { mpPreApproval } from "@/lib/mercadopago";
import { MESES_POR_PERIODICIDADE, type Periodicidade } from "@/lib/planos";

/**
 * A assinatura recorrente no Mercado Pago.
 *
 * Antes, o cartão gerava um pagamento avulso e a renovação era manual: a
 * pessoa pagava, ganhava 30 dias, e no fim batia numa parede para pagar de
 * novo. Quem não voltava não estava sem dinheiro — estava sem lembrar.
 *
 * Aqui quem cobra é o Mercado Pago, e as tentativas de recobrança quando um
 * cartão falha também são deles. O nosso papel é reagir ao que o webhook conta:
 * avisar a pessoa quando uma cobrança é recusada, e rebaixar para o plano
 * gratuito quando o Mercado Pago desistir.
 */

export interface AssinaturaRecorrente {
  id: string;
  status: string;
  proximaCobranca: string | null;
}

/**
 * Cria a assinatura e faz a primeira cobrança no mesmo passo.
 *
 * ATENÇÃO À CONFIGURAÇÃO: diferente do pagamento avulso, a assinatura NÃO
 * aceita `notification_url` por requisição — o Mercado Pago manda as
 * notificações de recorrência para a URL cadastrada na aplicação, no painel
 * deles. Sem isso configurado, as cobranças acontecem e nós nunca ficamos
 * sabendo: a assinatura seguiria "vencida" no nosso banco enquanto o cartão
 * da pessoa é debitado todo mês. Ver DEPLOY-WHATSAPP.md, seção do Mercado
 * Pago.
 *
 * `status: "authorized"` é o que dispara a cobrança imediata. Sem ele a
 * assinatura nasce pendente e ninguém é cobrado — a pessoa sairia do checkout
 * achando que assinou.
 */
export async function criarAssinaturaRecorrente(opcoes: {
  cardTokenId: string;
  emailDoPagador: string;
  valor: number;
  periodicidade: Periodicidade;
  nomeDoPlano: string;
  /** O id da nossa assinatura. É por ele que o webhook acha a linha na volta. */
  referenciaExterna: string;
  urlDeRetorno: string;
}): Promise<AssinaturaRecorrente | null> {
  /*
   * A frequência e o valor andam juntos, sempre.
   *
   * `MESES_POR_PERIODICIDADE` dá 1 para mensal e 12 para anual, e `valor` já
   * chega como o preço do PERÍODO INTEIRO — quem monta os dois é a rota do
   * cartão, com `valorDoPlano`. Separar os dois é o erro caro: 12 meses com
   * preço de um mês dá o ano por trinta dias; 1 mês com preço do ano cobra
   * doze vezes o que devia.
   */
  const meses = MESES_POR_PERIODICIDADE[opcoes.periodicidade];

  try {
    const criada = await mpPreApproval.create({
      body: {
        // Aparece na fatura e no e-mail do Mercado Pago. É o que faz a pessoa
        // reconhecer a cobrança em vez de contestar.
        reason: `Mimu ${opcoes.nomeDoPlano}`,
        external_reference: opcoes.referenciaExterna,
        payer_email: opcoes.emailDoPagador,
        card_token_id: opcoes.cardTokenId,
        back_url: opcoes.urlDeRetorno,
        status: "authorized",
        auto_recurring: {
          frequency: meses,
          frequency_type: "months",
          transaction_amount: opcoes.valor,
          currency_id: "BRL",
        },
      },
    });

    if (!criada.id) return null;

    return {
      id: String(criada.id),
      status: criada.status ?? "pending",
      proximaCobranca: criada.next_payment_date ?? null,
    };
  } catch (erro) {
    const e = erro as { message?: string; cause?: unknown };
    console.error("Erro ao criar assinatura recorrente no Mercado Pago:", {
      mensagem: e?.message,
      causa: JSON.stringify(e?.cause ?? null),
    });
    return null;
  }
}

/**
 * Cancela a recorrência.
 *
 * Chamado quando a pessoa cancela pelo produto. Não apaga o acesso na hora: o
 * que foi pago segue valendo até a data que já estava marcada, e o rebaixamento
 * acontece sozinho quando ela chega. Cortar o acesso de quem acabou de pagar o
 * mês seria cobrar por algo que não entregamos.
 */
export async function cancelarAssinaturaRecorrente(
  preapprovalId: string,
): Promise<boolean> {
  try {
    await mpPreApproval.update({
      id: preapprovalId,
      body: { status: "cancelled" },
    });
    return true;
  } catch (erro) {
    console.error("Erro ao cancelar assinatura recorrente:", erro);
    return false;
  }
}
