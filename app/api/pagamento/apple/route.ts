import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { buscarEmpresaEAssinatura } from "@/lib/assinatura";
import { verificarTransacao } from "@/lib/apple-store-server";
import { registrarEvento } from "@/lib/eventos";
import { PRODUTO_IAP } from "@/lib/iap";
import type { Periodicidade, PlanoPago } from "@/lib/planos";

/**
 * A compra feita na App Store virando acesso na Mimu.
 *
 * O app manda o `transactionId` que o StoreKit devolveu, e ESTE É O ÚNICO
 * papel dele: um protocolo para o servidor perguntar à Apple o que aconteceu.
 * Nada do que chega no corpo desta requisição libera coisa alguma — nem o
 * plano, nem a validade, nem o "ok". Quem responde isso é a Apple, e a
 * resposta dela é lida em lib/apple-store-server.ts.
 *
 * A regra é a mesma do checkout próprio: quem manda o preço, ou o resultado,
 * manda o que quiser. O navegador é território de quem usa o aparelho.
 */

/** O caminho inverso de PRODUTO_IAP: do id da Apple para plano e período. */
function decifrarProduto(
  produtoId: string,
): { plano: PlanoPago; periodicidade: Periodicidade } | null {
  for (const [plano, porPeriodo] of Object.entries(PRODUTO_IAP)) {
    for (const [periodicidade, id] of Object.entries(porPeriodo)) {
      if (id === produtoId) {
        return {
          plano: plano as PlanoPago,
          periodicidade: periodicidade as Periodicidade,
        };
      }
    }
  }
  return null;
}

/** O que dizer para cada recusa. Cada uma pede uma ação diferente de quem lê. */
const RECADO: Record<string, string> = {
  nao_encontrada:
    "A Apple não reconheceu essa compra. Se você acabou de assinar, espere um instante e toque em Restaurar compras.",
  expirada:
    "Essa assinatura da App Store não está mais ativa. Renove em Ajustes → Assinaturas.",
  invalida: "Não consegui validar essa compra.",
  indisponivel:
    "Não consegui falar com a App Store agora. Tente de novo em instantes.",
};

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let transactionId: unknown;
  try {
    ({ transactionId } = await request.json());
  } catch {
    transactionId = null;
  }

  if (typeof transactionId !== "string" || !transactionId.trim()) {
    return NextResponse.json({ error: "Compra ausente." }, { status: 400 });
  }

  const verificacao = await verificarTransacao(transactionId.trim());

  if (!verificacao.ok) {
    await registrarEvento("apple_compra_recusada", {
      userId: user.id,
      detalhe: { motivo: verificacao.motivo },
    });
    return NextResponse.json(
      { error: RECADO[verificacao.motivo] ?? RECADO.invalida },
      // "indisponivel" é problema NOSSO, e merece 502: quem monitora precisa
      // distinguir a Apple recusando de nós não conseguindo perguntar.
      { status: verificacao.motivo === "indisponivel" ? 502 : 402 },
    );
  }

  const produto = decifrarProduto(verificacao.produtoId);
  if (!produto) {
    /*
     * A Apple confirmou uma compra de um produto que a Mimu não vende.
     *
     * Não deveria acontecer — o bundle id já foi conferido —, mas se
     * acontecer, liberar "algum plano" seria pior do que recusar: não há como
     * saber qual.
     */
    await registrarEvento("apple_produto_desconhecido", {
      userId: user.id,
      detalhe: { produtoId: verificacao.produtoId },
    });
    return NextResponse.json({ error: RECADO.invalida }, { status: 402 });
  }

  const { empresa, assinatura } = await buscarEmpresaEAssinatura(
    supabase,
    user.id,
  );

  if (!empresa || !assinatura) {
    return NextResponse.json(
      { error: "Não encontrei os dados do seu negócio." },
      { status: 404 },
    );
  }

  /*
   * A gravação vai por service role, e não pelo client da pessoa.
   *
   * As policies deixam a dona ler e escrever a própria assinatura — inclusive
   * o campo `plano`. Deixar a liberação passar por ali significaria que a
   * mesma pessoa que compra é a que carimba o plano, e o carimbo é justamente
   * o que a Apple acabou de autorizar. Quem escreve aqui é o servidor.
   */
  const servidor = createServiceClient();

  const { error } = await servidor
    .from("assinaturas")
    .update({
      status: "ativa",
      plano: produto.plano,
      periodicidade: produto.periodicidade,
      origem: "apple",
      // A data vem da APPLE, e não da nossa conta de "mais um mês". Se ela
      // renovou, cancelou ou deu um período de carência, quem sabe é ela.
      proxima_cobranca: verificacao.expiraEm.toISOString(),
    })
    .eq("id", assinatura.id);

  if (error) {
    await registrarEvento("apple_compra_nao_gravou", {
      empresaId: empresa.id,
      userId: user.id,
      detalhe: { motivo: error.message },
    });
    return NextResponse.json(
      { error: "Sua compra foi aprovada, mas não consegui liberar aqui. Tente Restaurar compras em instantes." },
      { status: 500 },
    );
  }

  await registrarEvento("apple_compra_liberada", {
    empresaId: empresa.id,
    userId: user.id,
    detalhe: {
      plano: produto.plano,
      periodicidade: produto.periodicidade,
      ambiente: verificacao.ambiente,
    },
  });

  return NextResponse.json({
    ok: true,
    plano: produto.plano,
    expiraEm: verificacao.expiraEm.toISOString(),
  });
}
