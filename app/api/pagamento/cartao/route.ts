import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { buscarEmpresaEAssinatura, ativarAssinatura } from "@/lib/assinatura";
import { criarAssinaturaRecorrente } from "@/lib/assinatura-recorrente";
import { PLANOS, PLANO_PADRAO, planoValido ,
  periodicidadeValida,
  valorDoPlano,
  type Periodicidade,
} from "@/lib/planos";

interface CartaoPayload {
  token?: string;
  /** Identificador do aparelho, gerado pelo SDK do Mercado Pago no navegador. */
  device_id?: string | null;
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
  const { nome: nomePlano } = PLANOS[plano];

  /*
   * A periodicidade vem da ASSINATURA, nunca do corpo da requisição.
   *
   * Ela foi gravada em /assinar a partir da URL, e o valor sai da tabela do
   * servidor — mesma regra do plano. Aceitar do corpo deixaria qualquer pessoa
   * pedir "anual" pagando o preço do mês.
   */
  const periodicidade: Periodicidade =
    periodicidadeValida(assinatura.periodicidade) ?? "mensal";

  /*
   * O valor do PERÍODO INTEIRO, não o mensal.
   *
   * É o par que não pode se separar: `frequency` de 12 meses tem que vir com o
   * preço do ano. Cobrar o valor mensal com frequência anual daria à pessoa um
   * ano pelo preço de trinta dias; o contrário cobraria o ano inteiro todo mês.
   *
   * `valorDoPlano` devolve null quando a combinação não é vendida, e aí a
   * venda para aqui em vez de cair no mensal em silêncio — venda anual que
   * vira mensal cobra errado e marca a renovação errada.
   */
  const valorDoPeriodo = valorDoPlano(plano, periodicidade);

  if (valorDoPeriodo === null) {
    return NextResponse.json(
      { error: "Esse plano não é vendido nessa periodicidade." },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => null)) as CartaoPayload | null;

  if (!body?.token || !body.payment_method_id) {
    return NextResponse.json(
      { error: "Verifique os dados do cartão." },
      { status: 400 },
    );
  }

  try {
    /*
     * Assinatura recorrente, e não mais pagamento avulso.
     *
     * O avulso dava 30 dias e acabava: a pessoa batia numa parede e pagava de
     * novo na mão. Quem não voltava quase nunca estava sem dinheiro — estava
     * sem lembrar. Agora quem cobra todo mês é o Mercado Pago.
     *
     * A primeira cobrança acontece aqui mesmo, porque a assinatura nasce
     * `authorized`. Se nascesse pendente, a pessoa sairia do checkout achando
     * que assinou sem ter sido cobrada.
     */
    const recorrente = await criarAssinaturaRecorrente({
      cardTokenId: body.token,
      emailDoPagador: body.payer?.email || user.email || "",
      valor: valorDoPeriodo,
      periodicidade,
      nomeDoPlano: nomePlano,
      referenciaExterna: assinatura.id,
      urlDeRetorno: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    if (!recorrente) {
      return NextResponse.json(
        { error: "Não foi possível processar o pagamento agora." },
        { status: 502 },
      );
    }

    /*
     * `authorized` significa que o Mercado Pago aceitou o cartão e a cobrança
     * está autorizada. Qualquer outro estado é assinatura que não começou.
     */
    const aprovado = recorrente.status === "authorized";

  /*
   * Gravar em `pagamentos` e `assinaturas` usa a service role, não a sessão de
   * quem está comprando.
   *
   * A sessão continua provando a identidade logo acima, e a empresa e a
   * assinatura já vieram resolvidas a partir dela. Mas o registro comercial é
   * do negócio, não da cliente: deixar a escrita passar pela sessão obriga a
   * política do banco a permitir que qualquer pessoa autenticada escreva ali,
   * e foi por isso que dava para inserir um pagamento "aprovado" falso pelo
   * console do navegador. As consultas seguem escopadas pelo id que veio da
   * sessão verificada, então a service role não amplia o alcance de nada.
   */
    const servidor = createServiceClient();

    await servidor.from("pagamentos").insert({
      empresa_id: empresa.id,
      assinatura_id: assinatura.id,
      valor: valorDoPeriodo,
      status: aprovado ? "aprovado" : "pendente",
      forma_pagamento: "cartao",
      mp_payment_id: recorrente.id,
      mp_status: recorrente.status,
    });

    if (aprovado) {
      /*
       * Guarda o id da assinatura no Mercado Pago ANTES de ativar.
       *
       * É por ele que o webhook encontra esta linha quando a cobrança do mês
       * seguinte acontecer. Sem ele gravado, a renovação chegaria e não teria
       * onde pousar — a assinatura venceria no nosso banco com o cartão da
       * pessoa sendo debitado normalmente.
       */
      await servidor
        .from("assinaturas")
        .update({ mp_subscription_id: recorrente.id })
        .eq("id", assinatura.id);

      await ativarAssinatura(servidor, assinatura.id, periodicidade);
      return NextResponse.json({ status: "aprovado" });
    }

    return NextResponse.json({
      status: "recusado",
      error:
        "O cartão não foi aceito. Confira os dados ou tente outro cartão.",
    }, { status: 402 });

  } catch (err) {
    const detalhe = err as { message?: string; cause?: unknown; status?: number };
    console.error("Erro ao criar pagamento com cartão no Mercado Pago:", {
      mensagem: detalhe?.message,
      status: detalhe?.status,
      causa: JSON.stringify(detalhe?.cause ?? null),
    });
    return NextResponse.json(
      { error: "Verifique os dados do cartão." },
      { status: 400 },
    );
  }
}
