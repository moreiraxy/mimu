import { NextResponse } from "next/server";

/**
 * O arquivo que faz o iOS abrir o APLICATIVO no lugar do Safari.
 *
 * Sem ele, o link de confirmação de e-mail é um https como outro qualquer e o
 * sistema o entrega ao navegador padrão. A pessoa confirma no Safari, a sessão
 * nasce lá — e o aplicativo continua deslogado, porque a WKWebView do Capacitor
 * tem armazenamento de cookies separado. Foi assim que um cadastro feito pelo
 * app ficou impossível de concluir.
 *
 * É UMA ROTA E NÃO UM ARQUIVO EM public/ por causa do content-type: a Apple
 * exige `application/json`, e um arquivo sem extensão servido estaticamente sai
 * como octet-stream. O sintoma é o pior possível — o iOS baixa o arquivo, acha
 * o tipo errado e desiste em silêncio, sem nada nos logs.
 *
 * ESCOPO ESTREITO DE PROPÓSITO. Só as rotas de autenticação. Reivindicar `*`
 * faria QUALQUER link do mimu.pro abrir o aplicativo em quem o tem instalado —
 * inclusive a landing compartilhada no WhatsApp, que precisa abrir no
 * navegador para quem ainda vai decidir.
 *
 * O QUE FALTA DO OUTRO LADO: o entitlement `applinks:mimu.pro` no app
 * (ios/App/App/App.entitlements) e o Team ID no ambiente. O iOS busca este
 * arquivo na INSTALAÇÃO do app, e guarda o resultado — mudar o arquivo depois
 * não reconfigura quem já instalou.
 */

const BUNDLE = "br.com.mimu.app";

export function GET() {
  /*
   * Aceita mais de um time, separado por vírgula, porque haverá transição: o
   * app está hoje no time pessoal de quem desenvolve e vai para o da empresa.
   * Durante a troca os dois precisam valer, senão o link quebra para quem
   * estiver com a versão antiga instalada.
   */
  const times = (process.env.APPLE_TEAM_ID ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (times.length === 0) {
    // 404, e não um arquivo com marcador de lugar. Um AASA servido com o time
    // errado é pior que a ausência dele: o iOS o busca uma vez, guarda a
    // recusa, e o Universal Link não volta a funcionar sem reinstalar o app.
    console.error(
      "APPLE_TEAM_ID ausente no ambiente. O Universal Link não funciona, e o " +
        "link de confirmação de e-mail continua abrindo no navegador.",
    );
    return new NextResponse(null, { status: 404 });
  }

  return NextResponse.json(
    {
      applinks: {
        details: [
          {
            appIDs: times.map((time) => `${time}.${BUNDLE}`),
            components: [
              {
                "/": "/auth/confirmar",
                comment: "Confirmação de e-mail e link mágico",
              },
              { "/": "/auth/callback", comment: "Retorno do login social" },
            ],
          },
        ],
      },
    },
    {
      headers: {
        "content-type": "application/json",
        // O iOS busca este arquivo na instalação. Um cache longo faria a troca
        // de time demorar a valer para quem instalar logo depois.
        "cache-control": "public, max-age=300",
      },
    },
  );
}
