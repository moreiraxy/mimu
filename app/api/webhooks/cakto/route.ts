import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { interpretarEventoCakto, type PayloadCakto } from "@/lib/cakto";
import {
  liberarCompraExterna,
  reverterCompraExterna,
  enviarLinkParaDefinirSenha,
} from "@/lib/compra-externa";
import {
  avisarAdminsVenda,
  avisarAdminsVendaNaoLiberada,
} from "@/lib/admin-avisos";
import { registrarEvento } from "@/lib/eventos";
import { URL_SITE } from "@/lib/site";
import { PLANOS } from "@/lib/planos";

/**
 * Onde as vendas da Cakto entram.
 *
 * Antes desta rota, uma compra na Cakto não liberava nada: o dinheiro caía, a
 * cliente recebia o e-mail da Cakto dizendo que estava tudo certo, e não havia
 * conta nenhuma esperando por ela do outro lado.
 *
 * Três coisas do contrato da Cakto explicam o formato daqui, e valem
 * repetir porque contrariam o hábito de quem já mexeu com Mercado Pago:
 *
 * 1. Não há assinatura HMAC. A autenticidade é um campo `secret` no corpo,
 *    conferido contra CAKTO_WEBHOOK_SECRET. O valor é gerado pela Cakto, não
 *    por nós: foi descoberto disparando um evento de teste e lendo o payload
 *    que chegou, porque a API deles não expõe esse campo em canto nenhum.
 *
 * 2. A Cakto NÃO reenvia. Qualquer resposta é tratada como entrega bem
 *    sucedida, então devolver 500 não faz a notificação voltar — só apaga a
 *    venda em silêncio. Por isso aqui nada devolve erro depois da conferência
 *    do segredo: o que dá errado vira evento gravado e push para os admins.
 *
 * 3. `next_payment_date` vem no payload. É a data real da cobrança seguinte, e
 *    é ela que define até quando o acesso vale — inclusive no plano anual, que
 *    era o pedido original: o sistema descobre sozinho quantos dias a
 *    assinatura dá, sem ninguém contar no calendário.
 *
 * Sem sessão de usuário: a rota está fora do middleware (ver
 * ROTAS_PUBLICAS_SEM_AUTH em lib/supabase/middleware.ts) e escreve com a
 * service role.
 */

/** Resposta única. A Cakto ignora o status, mas um corpo honesto ajuda o log. */
function ok(detalhe: Record<string, unknown>) {
  return NextResponse.json({ recebido: true, ...detalhe });
}

/**
 * Compara dois segredos sem entregar onde eles diferem.
 *
 * `===` em string sai no primeiro caractere diferente, e o tempo dessa saída
 * vaza o prefixo correto para quem medir com paciência. Aqui o custo é o mesmo
 * para qualquer entrada.
 */
function segredoConfere(recebido: string, esperado: string): boolean {
  if (recebido.length !== esperado.length) return false;
  let diferenca = 0;
  for (let i = 0; i < recebido.length; i += 1) {
    diferenca |= recebido.charCodeAt(i) ^ esperado.charCodeAt(i);
  }
  return diferenca === 0;
}

export async function POST(request: Request) {
  const esperado = process.env.CAKTO_WEBHOOK_SECRET;

  if (!esperado) {
    console.error("CAKTO_WEBHOOK_SECRET não configurado — webhook recusado.");
    return NextResponse.json(
      { error: "Webhook não configurado." },
      { status: 500 },
    );
  }

  const payload = (await request.json().catch(() => null)) as PayloadCakto | null;

  if (!payload || !payload.secret || !segredoConfere(payload.secret, esperado)) {
    // 401 aqui é seguro: se o segredo não bate, ou é chamada forjada, ou o
    // painel da Cakto está com outro segredo — e nos dois casos reenviar não
    // resolveria nada mesmo.
    console.error("Webhook da Cakto recusado: segredo inválido.", {
      temSecret: Boolean(payload?.secret),
      evento: payload?.event ?? null,
    });
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const decisao = interpretarEventoCakto(payload);

  /*
   * O recado fica gravado ANTES de ser processado.
   *
   * Como a Cakto não reenvia, uma falha no meio do processamento levaria a
   * venda junto e não sobraria nem rastro de que ela chegou. Com o evento
   * gravado primeiro, o pior caso vira "a venda chegou e não entrou", que é
   * recuperável na mão, em vez de "não chegou venda nenhuma".
   */
  await registrarEvento("cakto_webhook", {
    detalhe: {
      evento: payload.event ?? null,
      acao: decisao.acao,
      pagamentoId: payload.data?.id ?? null,
      status: payload.data?.status ?? null,
      oferta: payload.data?.offer?.id ?? null,
    },
  });

  if (decisao.acao === "ignorar") {
    return ok({ ignorado: decisao.motivo });
  }

  if (decisao.acao === "avisar") {
    console.error("Webhook da Cakto exige atenção humana.", {
      motivo: decisao.motivo,
      ...decisao.detalhe,
    });
    await registrarEvento("cakto_atencao", {
      detalhe: { motivo: decisao.motivo, ...decisao.detalhe },
    });
    // Só puxa admin do sofá quando dinheiro entrou e o acesso não saiu.
    // Compra recusada é rotina de meio de pagamento, não emergência.
    if (decisao.motivo === "oferta_desconhecida" || decisao.motivo === "venda_sem_email_ou_id") {
      await avisarAdminsVendaNaoLiberada(
        decisao.motivo === "oferta_desconhecida"
          ? `Oferta ${String(decisao.detalhe.ofertaNome ?? decisao.detalhe.ofertaId)} não está mapeada`
          : "Venda chegou sem e-mail ou sem id",
      );
    }
    return ok({ atencao: decisao.motivo });
  }

  const service = createServiceClient();

  if (decisao.acao === "reverter") {
    const resultado = await reverterCompraExterna(service, {
      origem: "cakto",
      pagamentoId: decisao.pagamentoId,
      tipo: decisao.tipo,
      statusProvedor: decisao.statusProvedor,
    });

    await registrarEvento(
      resultado.ok ? "cakto_reversao" : "cakto_reversao_falhou",
      {
        empresaId: resultado.ok ? resultado.empresaId : null,
        detalhe: {
          tipo: decisao.tipo,
          pagamentoId: decisao.pagamentoId,
          motivo: resultado.ok ? null : resultado.motivo,
        },
      },
    );

    return ok({ revertido: resultado.ok });
  }

  const resultado = await liberarCompraExterna(service, {
    origem: "cakto",
    email: decisao.email,
    nomeNegocio: decisao.nomeNegocio,
    plano: decisao.plano,
    periodicidade: decisao.periodicidade,
    valor: decisao.valor,
    formaPagamento: decisao.formaPagamento,
    pagamentoId: decisao.pagamentoId,
    statusProvedor: decisao.statusProvedor,
    proximaCobranca: decisao.proximaCobranca,
  });

  if (!resultado.ok) {
    console.error("Venda da Cakto não foi liberada.", {
      motivo: resultado.motivo,
      pagamentoId: decisao.pagamentoId,
      email: decisao.email,
    });
    await registrarEvento("cakto_venda_falhou", {
      detalhe: {
        motivo: resultado.motivo,
        pagamentoId: decisao.pagamentoId,
        plano: decisao.plano,
        periodicidade: decisao.periodicidade,
      },
    });
    await avisarAdminsVendaNaoLiberada(`Pagamento aprovado, ${resultado.motivo}`);
    return ok({ liberado: false, motivo: resultado.motivo });
  }

  // Repetição da mesma notificação não manda e-mail nem push de novo.
  if (resultado.jaProcessado) {
    return ok({ liberado: true, repetido: true });
  }

  /*
   * Conta recém-criada não tem senha: ela nasceu do e-mail do checkout. Sem
   * este link, a pessoa pagou e não tem por onde entrar — o e-mail da Cakto
   * confirma a compra e não diz nada sobre senha.
   */
  if (resultado.contaNova) {
    await enviarLinkParaDefinirSenha(service, decisao.email, URL_SITE);
  }

  await registrarEvento("cakto_venda", {
    empresaId: resultado.empresaId,
    detalhe: {
      plano: decisao.plano,
      periodicidade: decisao.periodicidade,
      valor: decisao.valor,
      renovacao: decisao.renovacao,
      contaNova: resultado.contaNova,
      proximaCobranca: decisao.proximaCobranca?.toISOString() ?? null,
    },
  });

  await avisarAdminsVenda({
    plano: PLANOS[decisao.plano].nome,
    periodicidade: decisao.periodicidade,
    valor: decisao.valor,
    email: decisao.email,
    renovacao: decisao.renovacao,
  });

  return ok({
    liberado: true,
    contaNova: resultado.contaNova,
    renovacao: decisao.renovacao,
  });
}
