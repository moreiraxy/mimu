import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buscarEmpresaEAssinatura, ativarAssinatura } from "@/lib/assinatura";
import { mpPayment } from "@/lib/mercadopago";
import { PLANOS, PLANO_PADRAO, planoValido } from "@/lib/planos";

interface CartaoPayload {
  token?: string;
  issuer_id?: string;
  payment_method_id?: string;
  installments?: number;
  payer?: {
    email?: string;
    identification?: { type?: string; number?: string };
  };
}

/** Mensagem amigável por status_detail do MP — nunca expõe jargão técnico pra quem está pagando. */
function mensagemErro(status: string | undefined, statusDetail: string | undefined): string {
  if (status === "rejected") {
    return "Seu cartão não foi aprovado. Tente outro cartão ou pague com Pix.";
  }
  if (statusDetail?.startsWith("cc_rejected")) {
    return "Seu cartão não foi aprovado. Tente outro cartão ou pague com Pix.";
  }
  return "Verifique os dados do cartão.";
}

export async function POST(request: Request) {
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

  // O preço vem do plano gravado NA ASSINATURA e é resolvido aqui pela
  // tabela de lib/planos.ts. Nada de valor no corpo da requisição: aceitar
  // um número do navegador deixaria qualquer pessoa assinar o Premium por
  // um centavo trocando o payload.
  const plano = planoValido(assinatura.plano) ?? PLANO_PADRAO;
  const { nome: nomePlano, valorMensal } = PLANOS[plano];

  const body = (await request.json().catch(() => null)) as CartaoPayload | null;

  if (!body?.token || !body.payment_method_id) {
    return NextResponse.json(
      { error: "Verifique os dados do cartão." },
      { status: 400 },
    );
  }

  try {
    const pagamentoMP = await mpPayment.create({
      body: {
        transaction_amount: valorMensal,
        description: `Assinatura Mimu (${nomePlano})`,
        token: body.token,
        installments: body.installments || 1,
        payment_method_id: body.payment_method_id,
        issuer_id: body.issuer_id ? Number(body.issuer_id) : undefined,
        external_reference: assinatura.id,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/pagamento/webhook`,
        payer: {
          email: body.payer?.email || user.email || "",
          identification: body.payer?.identification?.number
            ? {
                type: body.payer.identification.type || "CPF",
                number: body.payer.identification.number,
              }
            : undefined,
        },
      },
    });

    if (!pagamentoMP.id) {
      return NextResponse.json(
        { error: "Não foi possível processar o pagamento agora." },
        { status: 502 },
      );
    }

    const aprovado = pagamentoMP.status === "approved";
    const statusInterno = aprovado
      ? "aprovado"
      : pagamentoMP.status === "rejected"
        ? "recusado"
        : "pendente";

    await supabase.from("pagamentos").insert({
      empresa_id: empresa.id,
      assinatura_id: assinatura.id,
      valor: valorMensal,
      status: statusInterno,
      forma_pagamento: "cartao",
      mp_payment_id: String(pagamentoMP.id),
      mp_status: pagamentoMP.status ?? null,
    });

    if (aprovado) {
      await ativarAssinatura(supabase, assinatura.id);
      return NextResponse.json({ status: "aprovado" });
    }

    if (pagamentoMP.status === "rejected") {
      return NextResponse.json(
        {
          status: "recusado",
          error: mensagemErro(pagamentoMP.status, pagamentoMP.status_detail),
        },
        { status: 402 },
      );
    }

    return NextResponse.json({ status: "pendente" });
  } catch (err) {
    console.error("Erro ao criar pagamento com cartão no Mercado Pago:", err);
    return NextResponse.json(
      { error: "Verifique os dados do cartão." },
      { status: 400 },
    );
  }
}
