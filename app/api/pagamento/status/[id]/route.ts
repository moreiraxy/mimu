import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buscarEmpresaEAssinatura, ativarAssinatura } from "@/lib/assinatura";
import { mpPayment } from "@/lib/mercadopago";
import type { StatusPagamentoMP } from "@/types";

/** Status bruto do Mercado Pago → status interno da Mimu. */
function mapearStatus(statusMP: string | undefined): StatusPagamentoMP {
  if (statusMP === "approved") return "aprovado";
  if (statusMP === "rejected" || statusMP === "cancelled") return "recusado";
  if (statusMP === "refunded" || statusMP === "charged_back") {
    return "reembolsado";
  }
  return "pendente";
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { empresa, assinatura } = await buscarEmpresaEAssinatura(
    supabase,
    user.id,
  );

  if (!empresa || !assinatura) {
    return NextResponse.json(
      { error: "Não encontrei sua assinatura." },
      { status: 404 },
    );
  }

  const { data: pagamento } = await supabase
    .from("pagamentos")
    .select("*")
    .eq("mp_payment_id", params.id)
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (!pagamento) {
    return NextResponse.json(
      { error: "Pagamento não encontrado." },
      { status: 404 },
    );
  }

  // Já resolvido antes (ex.: o webhook chegou primeiro) — não precisa
  // consultar o Mercado Pago de novo.
  if (pagamento.status !== "pendente") {
    return NextResponse.json({ status: pagamento.status });
  }

  try {
    const pagamentoMP = await mpPayment.get({ id: params.id });
    const statusAtual = mapearStatus(pagamentoMP.status);

    if (statusAtual !== "pendente") {
      await supabase
        .from("pagamentos")
        .update({ status: statusAtual, mp_status: pagamentoMP.status ?? null })
        .eq("id", pagamento.id);
    }

    if (statusAtual === "aprovado" && assinatura.status !== "ativa") {
      await ativarAssinatura(supabase, assinatura.id);
    }

    return NextResponse.json({ status: statusAtual });
  } catch (err) {
    console.error("Erro ao consultar status do pagamento no Mercado Pago:", err);
    return NextResponse.json(
      { error: "Não consegui verificar o pagamento agora." },
      { status: 502 },
    );
  }
}
