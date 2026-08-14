import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buscarEmpresaEAssinatura } from "@/lib/assinatura";
import { mpPayment, VALOR_MENSAL_MIMU } from "@/lib/mercadopago";

const EXPIRACAO_MINUTOS = 30;

/** Divide "Maria Silva" em {nome: "Maria", sobrenome: "Silva"} — MP pede first/last name separados. */
function dividirNome(nomeCompleto: string | undefined) {
  const partes = (nomeCompleto ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return { nome: "Cliente", sobrenome: "Mimu" };
  return {
    nome: partes[0]!,
    sobrenome: partes.slice(1).join(" ") || "Mimu",
  };
}

export async function POST() {
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

  const { nome, sobrenome } = dividirNome(
    user.user_metadata?.nome_completo as string | undefined,
  );
  const expiracao = new Date(Date.now() + EXPIRACAO_MINUTOS * 60 * 1000);

  try {
    const pagamentoMP = await mpPayment.create({
      body: {
        transaction_amount: VALOR_MENSAL_MIMU,
        description: "Assinatura Mimu (Plano Completo)",
        payment_method_id: "pix",
        date_of_expiration: expiracao.toISOString(),
        external_reference: assinatura.id,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pagamento/webhook`,
        payer: {
          email: user.email ?? "",
          first_name: nome,
          last_name: sobrenome,
        },
      },
    });

    const dadosPix = pagamentoMP.point_of_interaction?.transaction_data;

    if (!pagamentoMP.id || !dadosPix?.qr_code_base64) {
      return NextResponse.json(
        { error: "Não foi possível gerar o Pix agora. Tente de novo." },
        { status: 502 },
      );
    }

    const { error: insertError } = await supabase.from("pagamentos").insert({
      empresa_id: empresa.id,
      assinatura_id: assinatura.id,
      valor: VALOR_MENSAL_MIMU,
      status: "pendente",
      forma_pagamento: "pix",
      mp_payment_id: String(pagamentoMP.id),
      mp_status: pagamentoMP.status ?? null,
    });

    if (insertError) {
      return NextResponse.json(
        { error: "Não foi possível registrar o pagamento." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      paymentId: String(pagamentoMP.id),
      qrCode: dadosPix.qr_code,
      qrCodeBase64: dadosPix.qr_code_base64,
      expiraEm: expiracao.toISOString(),
    });
  } catch (err) {
    console.error("Erro ao criar pagamento Pix no Mercado Pago:", err);
    return NextResponse.json(
      { error: "Não foi possível gerar o Pix agora. Tente de novo." },
      { status: 502 },
    );
  }
}
