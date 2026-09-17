import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { buscarEmpresaEAssinatura } from "@/lib/assinatura";
import { mpPayment } from "@/lib/mercadopago";
import {
  PLANOS,
  PLANO_PADRAO,
  planoValido,
  periodicidadeValida,
  valorDoPlano,
} from "@/lib/planos";
import { urlAbsoluta } from "@/lib/site";

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
  const supabase = await createClient();

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
  const { nome: nomePlano } = PLANOS[plano];

  /*
   * O PIX COBRA O PERÍODO QUE A PESSOA ESCOLHEU.
   *
   * Cobrava sempre a mensalidade. Quem escolhia "Anual" via na tela "R$ 399,90
   * cobrados uma vez por ano", clicava em Pagar com Pix — o botão em destaque
   * — e recebia um Pix de R$ 39,90 que liberava um mês. Como Pix não renova
   * sozinho, em trinta dias o acesso acabava para quem achava ter comprado o
   * ano.
   *
   * A periodicidade vem da ASSINATURA, como no cartão, nunca do corpo da
   * requisição.
   */
  const periodicidade = periodicidadeValida(assinatura.periodicidade) ?? "mensal";
  const valor = valorDoPlano(plano, periodicidade);
  if (valor === null) {
    return NextResponse.json(
      { error: "Esse plano não é vendido nessa periodicidade." },
      { status: 400 },
    );
  }

  const { nome, sobrenome } = dividirNome(
    user.user_metadata?.nome_completo as string | undefined,
  );
  const expiracao = new Date(Date.now() + EXPIRACAO_MINUTOS * 60 * 1000);

  try {
    const pagamentoMP = await mpPayment.create({
      body: {
        transaction_amount: valor,
        description: `Assinatura Mimu (${nomePlano}, ${periodicidade})`,
        /*
         * O período viaja DENTRO da cobrança, e é daqui que o webhook o lê.
         *
         * Ler da assinatura na hora do pagamento abriria uma porta: gerar o
         * Pix mensal, trocar para anual na tela e pagar os R$ 39,90 — o
         * webhook veria "anual" e liberaria doze meses. Gravado aqui, pelo
         * servidor, o período é o que foi cobrado, e nada que a pessoa troque
         * depois o muda.
         */
        metadata: { periodicidade },
        payment_method_id: "pix",
        date_of_expiration: expiracao.toISOString(),
        external_reference: assinatura.id,
        statement_descriptor: "MIMU",
        notification_url: urlAbsoluta("/api/pagamento/webhook"),
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


/*
 * Gravar em `pagamentos` e `assinaturas` usa a service role, não a sessão de
 * quem está comprando.
 *
 * A sessão continua sendo quem prova a identidade logo acima, e a empresa e a
 * assinatura já vêm resolvidas a partir dela. Mas o registro comercial é do
 * negócio, não da cliente: deixar a escrita passar pela sessão dela obriga a
 * política do banco a permitir que qualquer pessoa autenticada escreva ali, e
 * foi exatamente por isso que dava para inserir um pagamento "aprovado" falso
 * pelo console do navegador.
 *
 * Com a escrita aqui, o banco pode negar escrita à cliente sem quebrar o
 * checkout. As consultas seguem escopadas por `empresa.id`, que veio da
 * sessão verificada, então a service role não amplia o alcance de nada.
 */
    const { error: insertError } = await createServiceClient()
      .from("pagamentos")
      .insert({
        empresa_id: empresa.id,
        assinatura_id: assinatura.id,
        valor,
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
      // A tela do Pix mostrava só o QR Code, e o valor aparecia pela
      // primeira vez no app do banco.
      valor,
      periodicidade,
      plano: nomePlano,
    });
  } catch (err) {
    // O log guarda o que o Mercado Pago respondeu, não só "deu erro". Sem
    // isso, uma recusa do lado deles (conta sem chave Pix cadastrada, por
    // exemplo) chegava aqui como uma falha genérica e não havia como
    // descobrir a causa olhando o log.
    const detalhe = err as { message?: string; cause?: unknown; status?: number };
    console.error("Erro ao criar pagamento Pix no Mercado Pago:", {
      mensagem: detalhe?.message,
      status: detalhe?.status,
      causa: JSON.stringify(detalhe?.cause ?? null),
    });

    return NextResponse.json(
      {
        error:
          "Não foi possível gerar o Pix agora. Tente pelo cartão ou fale com a gente.",
      },
      { status: 502 },
    );
  }
}
