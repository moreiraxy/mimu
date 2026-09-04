import "server-only";
import { createSign } from "node:crypto";
import { connect } from "node:http2";

/**
 * Notificação para o aplicativo iOS, pelo APNs da Apple.
 *
 * Existe porque o Web Push de `lib/push.ts` NÃO FUNCIONA dentro do aplicativo:
 * a WKWebView não expõe `PushManager`, e a inscrição nem chega a ser criada.
 * Quem abre a Mimu pelo Safari continua no Web Push; quem abre pelo app
 * depende deste arquivo.
 *
 * HTTP/2 É OBRIGATÓRIO, e é a primeira pedra do caminho. O APNs recusa
 * HTTP/1.1, e o `fetch` do Node só fala 1.1 — a tentação de escrever
 * `fetch("https://api.push.apple.com/...")` compila, tipa, e falha em produção.
 * Por isso `node:http2`, que é embutido: uma dependência a menos numa cadeia
 * que assina credencial.
 */

interface Credenciais {
  keyId: string;
  teamId: string;
  chave: string;
  topico: string;
}

function credenciais(): Credenciais | null {
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const chave = process.env.APNS_PRIVATE_KEY;
  const topico = process.env.APNS_TOPIC;

  if (!keyId || !teamId || !chave || !topico) {
    // Barulhento como em lib/push.ts e lib/apple-store-server.ts: sem as
    // chaves, NENHUM aviso chega a quem usa o aplicativo, e descobrir isso
    // pelo silêncio é descobrir tarde.
    console.error(
      "APNs desativado: falta " +
        [
          !keyId && "APNS_KEY_ID",
          !teamId && "APNS_TEAM_ID",
          !chave && "APNS_PRIVATE_KEY",
          !topico && "APNS_TOPIC",
        ]
          .filter(Boolean)
          .join(", ") +
        " no ambiente. Nenhuma notificação chega ao aplicativo iOS.",
    );
    return null;
  }

  // A variável costuma chegar com \n escapado; o PKCS#8 exige as quebras de
  // verdade. Mesmo tratamento de lib/apple-store-server.ts.
  return { keyId, teamId, chave: chave.replace(/\\n/g, "\n"), topico };
}

function base64url(valor: string | Buffer): string {
  return Buffer.from(valor)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/*
 * O crachá, guardado entre envios.
 *
 * A Apple RECUSA quem pede token demais — gerar um por notificação leva a
 * 429 num disparo em lote, que é justamente como os alertas diários saem. Ela
 * aceita o mesmo por até uma hora; aqui são 50 minutos, com folga para o
 * relógio do servidor.
 */
let crachaEmCache: { valor: string; expiraEm: number } | null = null;

function cracha(c: Credenciais): string {
  const agora = Math.floor(Date.now() / 1000);
  if (crachaEmCache && crachaEmCache.expiraEm > agora)
    return crachaEmCache.valor;

  const cabecalho = base64url(
    JSON.stringify({ alg: "ES256", kid: c.keyId, typ: "JWT" }),
  );
  const corpo = base64url(JSON.stringify({ iss: c.teamId, iat: agora }));

  /*
   * `dsaEncoding: "ieee-p1363"` pelo mesmo motivo de lib/apple-store-server.ts:
   * o padrão do Node é DER, o JWT exige os dois números crus. Com DER a Apple
   * devolve 403 InvalidProviderToken e não diz o porquê.
   */
  const assinatura = createSign("SHA256")
    .update(`${cabecalho}.${corpo}`)
    .sign({ key: c.chave, dsaEncoding: "ieee-p1363" });

  const valor = `${cabecalho}.${corpo}.${base64url(assinatura)}`;
  crachaEmCache = { valor, expiraEm: agora + 50 * 60 };
  return valor;
}

export interface ResultadoApns {
  ok: boolean;
  /** Motivo cru da Apple. `BadDeviceToken` significa apagar a inscrição. */
  motivo?: string;
  /** Token que não vale mais: o aparelho desinstalou ou trocou de dono. */
  descartar?: boolean;
}

/**
 * Manda uma notificação para um aparelho.
 *
 * PRODUÇÃO PRIMEIRO, sandbox depois, como `lib/apple-store-server.ts` faz com
 * o recibo — e pelo mesmo motivo. Um build de desenvolvimento registra o
 * aparelho na sandbox, e um de produção na outra ponta; o token tem a mesma
 * cara nos dois casos. Perguntar aos dois é o que faz o teste no aparelho de
 * quem desenvolve funcionar sem variável separada.
 */
export async function enviarApns(
  token: string,
  aviso: { titulo: string; corpo: string; destino?: string },
): Promise<ResultadoApns> {
  const c = credenciais();
  if (!c) return { ok: false, motivo: "indisponivel" };

  const carga = JSON.stringify({
    aps: {
      alert: { title: aviso.titulo, body: aviso.corpo },
      sound: "default",
    },
    // Lido pelo app ao tocar na notificação. O padrão é o painel, igual ao
    // que public/sw.js faz no Web Push.
    destino: aviso.destino ?? "/dashboard",
  });

  for (const host of [
    "https://api.push.apple.com",
    "https://api.sandbox.push.apple.com",
  ]) {
    const r = await enviarPara(host, token, carga, c);
    if (r.ok) return r;
    // Só vale tentar a sandbox quando a produção não conhece o token.
    if (
      r.motivo !== "BadDeviceToken" &&
      r.motivo !== "DeviceTokenNotForTopic"
    ) {
      return r;
    }
  }

  return { ok: false, motivo: "BadDeviceToken", descartar: true };
}

function enviarPara(
  host: string,
  token: string,
  carga: string,
  c: Credenciais,
): Promise<ResultadoApns> {
  return new Promise((resolve) => {
    const cliente = connect(host);
    // Sem isto, um APNs fora do ar pendura o disparo dos alertas diários.
    const relogio = setTimeout(() => {
      cliente.destroy();
      resolve({ ok: false, motivo: "timeout" });
    }, 10_000);

    const encerrar = (r: ResultadoApns) => {
      clearTimeout(relogio);
      cliente.close();
      resolve(r);
    };

    cliente.on("error", (erro) =>
      encerrar({ ok: false, motivo: `conexao: ${erro.message}` }),
    );

    const req = cliente.request({
      ":method": "POST",
      ":path": `/3/device/${token}`,
      authorization: `bearer ${cracha(c)}`,
      "apns-topic": c.topico,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
      "content-length": Buffer.byteLength(carga),
    });

    let status = 0;
    let corpo = "";
    req.on("response", (cab) => {
      status = Number(cab[":status"]) || 0;
    });
    req.on("data", (p) => (corpo += p));
    req.on("error", (erro) =>
      encerrar({ ok: false, motivo: `envio: ${erro.message}` }),
    );
    req.on("end", () => {
      if (status === 200) return encerrar({ ok: true });
      const motivo =
        (JSON.parse(corpo || "{}") as { reason?: string }).reason ??
        `http ${status}`;
      encerrar({
        ok: false,
        motivo,
        // 410 é a Apple dizendo que o token morreu. Guardá-lo só faria o
        // próximo disparo gastar uma chamada para receber o mesmo 410.
        descartar: status === 410 || motivo === "BadDeviceToken",
      });
    });

    req.end(carga);
  });
}
