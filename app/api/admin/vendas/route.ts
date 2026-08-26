import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { ehAdmin } from "@/lib/admin";
import { liberarCompraExterna } from "@/lib/compra-externa";
import { registrarEvento } from "@/lib/eventos";
import {
  planoValido,
  periodicidadeValida,
  valorDoPlano,
  PLANOS,
} from "@/lib/planos";
import type { FormaPagamentoMP } from "@/types";

/**
 * Registra uma venda feita fora de qualquer plataforma.
 *
 * Boa parte da venda no começo acontece por fora: conversa no WhatsApp, Pix
 * direto, combinado pessoalmente. Sem isto, liberar o acesso exigia mexer no
 * banco na mão a cada venda, e o prazo comprado ficava sem registro nenhum.
 *
 * Reaproveita `liberarCompraExterna`, que é o mesmo caminho do checkout
 * externo. Isso não é economia de código: é garantia de que a venda manual
 * cria a conta, ativa a assinatura e grava o pagamento exatamente como as
 * outras, sem um segundo comportamento para manter em dia.
 *
 * A checagem de admin é REFEITA aqui, e não herdada do layout: uma chamada
 * direta a esta URL nunca passa por layout nenhum, e esta rota libera acesso
 * pago.
 */

const FORMAS: FormaPagamentoMP[] = ["pix", "cartao", "boleto"];

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!(await ehAdmin(user?.id))) {
    // 404 e não 403: 403 confirmaria que a rota existe.
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const corpo = await request.json().catch(() => null);

  const email = typeof corpo?.email === "string" ? corpo.email.trim().toLowerCase() : "";
  const nomeNegocio =
    typeof corpo?.nomeNegocio === "string" && corpo.nomeNegocio.trim()
      ? corpo.nomeNegocio.trim()
      : null;
  const plano = planoValido(corpo?.plano);
  const periodicidade = periodicidadeValida(corpo?.periodicidade);
  const referencia =
    typeof corpo?.referencia === "string" && corpo.referencia.trim()
      ? corpo.referencia.trim()
      : null;
  const formaPagamento: FormaPagamentoMP = FORMAS.includes(corpo?.formaPagamento)
    ? corpo.formaPagamento
    : "pix";

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }
  if (!plano || !periodicidade) {
    return NextResponse.json(
      { error: "Escolha o plano e a periodicidade." },
      { status: 400 },
    );
  }

  /*
   * O valor vem da tabela do servidor, nunca do formulário.
   *
   * Quem registra a venda pode digitar qualquer número, e um valor errado aqui
   * não é só um registro torto: ele vai para o relatório de receita do painel.
   * Se um dia existir venda com desconto, isso passa a ser um campo próprio e
   * explícito, e não uma caixa de texto livre.
   */
  const valor = valorDoPlano(plano, periodicidade);

  if (valor === null) {
    return NextResponse.json(
      {
        error: `O plano ${PLANOS[plano].nome} não tem preço ${periodicidade} definido.`,
      },
      { status: 400 },
    );
  }

  const resultado = await liberarCompraExterna(createServiceClient(), {
    origem: "manual",
    email,
    nomeNegocio,
    plano,
    periodicidade,
    valor,
    formaPagamento,
    // Sem referência escrita, uma é gerada: ela é a chave de idempotência, e
    // sem chave nenhuma o mesmo registro feito duas vezes viraria duas linhas
    // de pagamento e dois e-mails de "defina sua senha".
    pagamentoId: referencia ?? `manual-${email}-${Date.now()}`,
    statusProvedor: null,
  });

  if (!resultado.ok) {
    console.error("Venda manual não foi registrada.", resultado.motivo);
    return NextResponse.json(
      { error: "Não consegui registrar a venda.", motivo: resultado.motivo },
      { status: 500 },
    );
  }

  await registrarEvento("venda_manual", {
    empresaId: resultado.empresaId,
    detalhe: {
      email,
      plano,
      periodicidade,
      valor,
      contaNova: resultado.contaNova,
      jaProcessado: resultado.jaProcessado,
      registradaPor: user?.email ?? null,
    },
  });

  return NextResponse.json({
    ok: true,
    empresaId: resultado.empresaId,
    contaNova: resultado.contaNova,
    jaProcessado: resultado.jaProcessado,
    valor,
  });
}
