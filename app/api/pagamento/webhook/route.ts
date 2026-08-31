import { NextResponse } from "next/server";
import {
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from "mercadopago";
import { createServiceClient } from "@/lib/supabase/service";
import { ativarAssinatura } from "@/lib/assinatura";
import { PLANO_GRATUITO } from "@/lib/planos";
import { registrarEvento } from "@/lib/eventos";
import { mpPayment, mpPreApproval } from "@/lib/mercadopago";
import type { StatusPagamentoMP } from "@/types";

function mapearStatus(statusMP: string | undefined): StatusPagamentoMP {
  if (statusMP === "approved") return "aprovado";
  if (statusMP === "rejected" || statusMP === "cancelled") return "recusado";
  if (statusMP === "refunded" || statusMP === "charged_back") {
    return "reembolsado";
  }
  return "pendente";
}

/**
 * Notificação servidor-a-servidor do Mercado Pago (IPN) — nunca tem sessão
 * de usuário (excluída do middleware, ver lib/supabase/middleware.ts), por
 * isso usa a service role pra ler/gravar direto, ignorando RLS.
 */
/**
 * O que fazer quando o Mercado Pago conta algo sobre uma assinatura.
 *
 * Duas notícias possíveis, e as duas mexem no acesso da pessoa:
 *
 * A cobrança do mês passou → estende `proxima_cobranca` e mantém o acesso.
 * Sem isto, quem paga em dia perde o acesso mesmo assim, porque o gate compara
 * a data e ela nunca andaria.
 *
 * A assinatura parou (cancelada, ou o Mercado Pago desistiu depois das
 * tentativas dele) → a conta cai para o plano gratuito. Não perde nada: o
 * histórico continua lá, e ela segue registrando vendas.
 */
async function tratarEventoDeAssinatura(tipo: string, preapprovalId: string) {
  const supabase = createServiceClient();

  const { data: assinatura } = await supabase
    .from("assinaturas")
    .select("id, empresa_id, periodicidade, plano")
    .eq("mp_subscription_id", preapprovalId)
    .maybeSingle();

  if (!assinatura) {
    /*
     * Não achamos a assinatura. Devolve 200 assim mesmo.
     *
     * Pode ser teste do painel do Mercado Pago, ou uma assinatura criada fora
     * do fluxo da Mimu. Devolver erro faria o Mercado Pago reenviar por dias
     * uma notificação que nunca vai ter para onde ir.
     */
    await registrarEvento("mp_assinatura_sem_dono", {
      detalhe: { tipo, preapprovalId },
    });
    return NextResponse.json({ success: true });
  }

  const estado = await mpPreApproval.get({ id: preapprovalId }).catch(() => null);
  const status = estado?.status ?? null;

  if (tipo === "subscription_authorized_payment" && status === "authorized") {
    const periodicidade =
      assinatura.periodicidade === "anual" ? "anual" : "mensal";

    await ativarAssinatura(supabase, assinatura.id, periodicidade);
    await registrarEvento("mp_cobranca_recorrente", {
      empresaId: assinatura.empresa_id,
      detalhe: { preapprovalId, periodicidade },
    });
    return NextResponse.json({ success: true });
  }

  /*
   * `cancelled` é o Mercado Pago dizendo que acabou — por cancelamento ou
   * porque as tentativas de recobrança se esgotaram. `paused` é temporário e
   * não rebaixa: pode voltar sozinha, e cortar o acesso de quem vai voltar em
   * dois dias é pior do que esperar.
   */
  if (status === "cancelled") {
    await supabase
      .from("assinaturas")
      .update({
        plano: PLANO_GRATUITO,
        status: "ativa",
        proxima_cobranca: null,
        valor_mensal: 0,
      })
      .eq("id", assinatura.id);

    await registrarEvento("mp_assinatura_encerrada", {
      empresaId: assinatura.empresa_id,
      detalhe: { preapprovalId, planoAnterior: assinatura.plano },
    });
  }

  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  // O corpo é lido uma vez só: `request.json()` não pode ser chamado duas
  // vezes, e ele é preciso tanto para achar o id quanto para saber o tipo.
  const corpo = (await request.json().catch(() => null)) as {
    type?: string;
    data?: { id?: string | number };
  } | null;

  // O Mercado Pago manda o `data.id` na query nas notificações de pagamento,
  // mas o simulador do painel e as notificações do formato novo (type:
  // "order") mandam só no corpo. Lendo dos dois lugares, o mesmo endpoint
  // atende os dois formatos.
  const idDaQuery = url.searchParams.get("data.id");
  const idDoCorpo = corpo?.data?.id != null ? String(corpo.data.id) : null;
  const dataId = idDaQuery ?? idDoCorpo;

  if (!secret) {
    console.error("MERCADOPAGO_WEBHOOK_SECRET não configurado.");
    return NextResponse.json(
      { error: "Webhook não configurado." },
      { status: 500 },
    );
  }

  // A assinatura é conferida contra os dois ids possíveis. O Mercado Pago
  // monta a dele com o id que mandou; tentar só um dos dois recusava
  // notificação legítima do outro formato. Continua sendo obrigatório bater
  // o HMAC com o segredo — isto amplia o formato aceito, não afrouxa a
  // verificação.
  const candidatos = [idDaQuery, idDoCorpo].filter(
    (id, i, lista): id is string | null => lista.indexOf(id) === i,
  );

  let motivoRecusa: string | null = null;
  const passou = candidatos.some((candidato) => {
    try {
      WebhookSignatureValidator.validate({
        xSignature: request.headers.get("x-signature"),
        xRequestId: request.headers.get("x-request-id"),
        dataId: candidato,
        secret,
        toleranceSeconds: 300,
      });
      return true;
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        motivoRecusa = err.reason;
        return false;
      }
      throw err;
    }
  });

  if (!passou) {
    console.error("Webhook do Mercado Pago rejeitado:", {
      motivo: motivoRecusa,
      temCabecalhoAssinatura: Boolean(request.headers.get("x-signature")),
      idDaQuery,
      idDoCorpo,
      tipo: corpo?.type,
    });
    return NextResponse.json({ error: "Assinatura inválida." }, { status: 401 });
  }

  /*
   * As notificações de ASSINATURA são outro assunto, e chegam com outro tipo.
   *
   * `subscription_authorized_payment` é a cobrança do mês acontecendo. Sem
   * tratar isso, o cartão da pessoa seria debitado todo mês e a assinatura
   * venceria no nosso banco assim mesmo — ela pagaria e perderia o acesso,
   * que é o pior desfecho possível.
   *
   * `subscription_preapproval` é mudança de estado da assinatura: pausada,
   * cancelada, ou o Mercado Pago desistindo depois das tentativas dele.
   */
  if (
    corpo?.type === "subscription_authorized_payment" ||
    corpo?.type === "subscription_preapproval"
  ) {
    if (!dataId) return NextResponse.json({ success: true });
    return tratarEventoDeAssinatura(corpo.type, dataId);
  }

  // Só notificação de pagamento move alguma coisa aqui. As de outros tipos
  // (order, merchant_order, point) são confirmadas com 200 para o Mercado
  // Pago parar de reenviar — devolver erro faria ele tentar de novo por dias.
  if (corpo?.type && corpo.type !== "payment") {
    return NextResponse.json({ success: true, ignorado: corpo.type });
  }

  if (!dataId) {
    return NextResponse.json({ success: true });
  }

  const supabase = createServiceClient();

  try {
    const pagamentoMP = await mpPayment.get({ id: dataId });
    const statusAtual = mapearStatus(pagamentoMP.status);

    const { data: pagamento } = await supabase
      .from("pagamentos")
      .select("*")
      .eq("mp_payment_id", dataId)
      .maybeSingle();

    if (!pagamento) {
      // Notificação de um pagamento que não nasceu no fluxo da Mimu (ex.:
      // teste disparado pelo painel do MP) — nada pra atualizar aqui.
      return NextResponse.json({ success: true });
    }

    if (statusAtual !== pagamento.status) {
      await supabase
        .from("pagamentos")
        .update({
          status: statusAtual,
          mp_status: pagamentoMP.status ?? null,
        })
        .eq("id", pagamento.id);
    }

    if (statusAtual === "aprovado") {
      await ativarAssinatura(supabase, pagamento.assinatura_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const status = (err as { status?: number })?.status;

    // Pagamento que não existe no Mercado Pago (id de teste do painel, por
    // exemplo). Isso nunca vai passar a existir, então responder 500 só faria
    // ele reenviar a mesma notificação por dias. 200 encerra o assunto.
    if (status === 404) {
      return NextResponse.json({ success: true, ignorado: "pagamento_inexistente" });
    }

    // O resto continua 500 de propósito: falha de rede ou do banco é
    // temporária, e aí o reenvio do Mercado Pago é justamente o que salva a
    // ativação da assinatura.
    console.error("Erro ao processar webhook do Mercado Pago:", err);
    return NextResponse.json(
      { error: "Erro ao processar notificação." },
      { status: 500 },
    );
  }
}
