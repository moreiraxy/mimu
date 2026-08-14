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
