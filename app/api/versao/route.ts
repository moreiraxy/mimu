import { NextResponse } from "next/server";

/**
 * Qual versão está no ar.
 *
 * PARA QUE SERVE: responder "o deploy entrou?" sem adivinhação. Antes isso era
 * investigação — comparar nome de arquivo compilado, conferir a versão do
 * service worker, procurar um endpoint de deploy que a Hostinger não tem — e
 * o truque do arquivo compilado falha justamente quando a mudança é de tela
 * interna, porque o arquivo observado não muda.
 *
 *     curl -s https://mimu.pro/api/versao
 *
 * PÚBLICA, e de propósito: ela precisa funcionar ANTES do login, que é onde a
 * dúvida aparece. O que ela revela é o hash curto do commit e a hora da
 * compilação — nada sobre conta, dado ou configuração. O repositório é
 * privado, então o hash não abre nada: é um número de série.
 *
 * `dynamic` forçado porque o padrão do Next é servir rota sem parâmetro do
 * cache estático — e uma resposta cacheada aqui mentiria exatamente na
 * pergunta que ela existe para responder.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    commit: process.env.NEXT_PUBLIC_COMMIT ?? "desconhecido",
    versao: process.env.NEXT_PUBLIC_VERSAO ?? null,
    construido_em: process.env.NEXT_PUBLIC_BUILD_EM ?? null,
  });
}
