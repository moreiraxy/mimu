import { NextResponse } from "next/server";
import {
  WebhookSignatureValidator,
  InvalidWebhookSignatureError,
} from "mercadopago";
import { createServiceClient } from "@/lib/supabase/service";
import { ativarAssinatura } from "@/lib/assinatura";
import { mpPayment } from "@/lib/mercadopago";
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
export async function POST(request: Request) {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id");
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;

  if (!secret) {
    console.error("MERCADOPAGO_WEBHOOK_SECRET não configurado.");
    return NextResponse.json(
      { error: "Webhook não configurado." },
      { status: 500 },
    );
  }

  try {
    WebhookSignatureValidator.validate({
      xSignature: request.headers.get("x-signature"),
      xRequestId: request.headers.get("x-request-id"),
      dataId,
      secret,
      toleranceSeconds: 300,
    });
  } catch (err) {
    if (err instanceof InvalidWebhookSignatureError) {
      console.error(
        "Webhook do Mercado Pago rejeitado — assinatura inválida:",
        err.reason,
      );
      return NextResponse.json(
        { error: "Assinatura inválida." },
        { status: 401 },
      );
    }
    throw err;
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
    console.error("Erro ao processar webhook do Mercado Pago:", err);
    return NextResponse.json(
      { error: "Erro ao processar notificação." },
      { status: 500 },
    );
  }
}
