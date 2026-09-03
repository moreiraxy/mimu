import { createSign } from "node:crypto";

/**
 * A conversa com a App Store Server API — o único lugar que pode dizer se uma
 * compra da Apple é verdadeira.
 *
 * POR QUE O SERVIDOR PRECISA PERGUNTAR. O app devolve um `transactionId`
 * quando a compra termina, e é tentador liberar o acesso ali mesmo. Não dá: o
 * navegador é território de quem usa o aparelho, e quem abre o console consegue
 * dizer "comprei". É o mesmo buraco de aceitar o preço vindo do cliente, que
 * lib/planos.ts já evita no checkout próprio.
 *
 * Então o `transactionId` é só um PROTOCOLO: com ele, o servidor pergunta à
 * Apple o que de fato aconteceu, e é a resposta dela — assinada — que libera.
 *
 * ---------------------------------------------------------------------------
 * O QUE PRECISA ESTAR NO AMBIENTE, e onde achar cada coisa
 * ---------------------------------------------------------------------------
 *
 *   APPLE_ISSUER_ID   App Store Connect → Usuários e Acesso → Chaves de API
 *                     (Integrações) → o "Issuer ID" no topo da página
 *   APPLE_KEY_ID      o id da chave criada nessa mesma página
 *   APPLE_PRIVATE_KEY o conteúdo do arquivo .p8 baixado ali — ele só pode ser
 *                     baixado UMA vez
 *   APPLE_BUNDLE_ID   br.com.mimu.app
 *
 * Sem qualquer um deles, `verificarTransacao` devolve `indisponivel` em vez de
 * estourar: a compra não é liberada, e quem chamou sabe distinguir "a Apple
 * disse não" de "nós não conseguimos perguntar". As duas coisas exigem
 * respostas diferentes de quem está esperando na tela.
 */

/** O ambiente decide o endereço: sandbox durante a revisão, produção depois. */
const ENDERECOS = {
  producao: "https://api.storekit.itunes.apple.com/inApps/v1",
  sandbox: "https://api.storekit-sandbox.itunes.apple.com/inApps/v1",
} as const;

export type ResultadoVerificacao =
  | { ok: true; produtoId: string; expiraEm: Date; ambiente: "producao" | "sandbox" }
  | { ok: false; motivo: "nao_encontrada" | "expirada" | "invalida" | "indisponivel" };

interface Credenciais {
  issuerId: string;
  keyId: string;
  chave: string;
  bundleId: string;
}

function credenciais(): Credenciais | null {
  const issuerId = process.env.APPLE_ISSUER_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const chave = process.env.APPLE_PRIVATE_KEY;
  const bundleId = process.env.APPLE_BUNDLE_ID;

  if (!issuerId || !keyId || !chave || !bundleId) {
    // Barulhento de propósito, como em lib/push.ts: sem as chaves NENHUMA
    // compra da Apple é liberada, e descobrir isso pelo silêncio custaria
    // clientes pagantes sem acesso.
    console.error(
      "App Store Server API desativada: falta " +
        [
          !issuerId && "APPLE_ISSUER_ID",
          !keyId && "APPLE_KEY_ID",
          !chave && "APPLE_PRIVATE_KEY",
          !bundleId && "APPLE_BUNDLE_ID",
        ]
          .filter(Boolean)
          .join(", ") +
        " no ambiente. Nenhuma assinatura comprada na Apple é liberada.",
    );
    return null;
  }

  // A variável de ambiente costuma chegar com \n escapado; o PKCS#8 exige as
  // quebras de verdade.
  return { issuerId, keyId, chave: chave.replace(/\\n/g, "\n"), bundleId };
}

function base64url(valor: string | Buffer): string {
  return Buffer.from(valor)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * O crachá que a Apple exige em cada chamada.
 *
 * Vale 20 minutos no máximo, por regra dela. Aqui são 15, com folga para o
 * relógio do servidor não estar perfeitamente sincronizado.
 *
 * ASSINADO À MÃO com `node:crypto`, e não com uma biblioteca de JWT — é o
 * mesmo caminho que lib/supabase/como-usuario.ts já usa para o token do
 * Supabase. Uma dependência a mais numa cadeia que assina credencial é
 * superfície que alguém precisa auditar depois.
 *
 * `dsaEncoding: "ieee-p1363"` é o detalhe que quebra silenciosamente se
 * esquecido: por padrão o Node devolve a assinatura ECDSA em DER, e o JWT
 * exige os dois números crus, um atrás do outro. Com DER a Apple recusa com
 * 401, sem dizer o porquê.
 */
function cracha(c: Credenciais): string {
  const agora = Math.floor(Date.now() / 1000);

  const cabecalho = base64url(
    JSON.stringify({ alg: "ES256", kid: c.keyId, typ: "JWT" }),
  );
  const corpo = base64url(
    JSON.stringify({
      iss: c.issuerId,
      iat: agora,
      exp: agora + 15 * 60,
      aud: "appstoreconnect-v1",
      bid: c.bundleId,
    }),
  );

  const assinatura = createSign("SHA256")
    .update(`${cabecalho}.${corpo}`)
    .sign({ key: c.chave, dsaEncoding: "ieee-p1363" });

  return `${cabecalho}.${corpo}.${base64url(assinatura)}`;
}

/**
 * Abre um JWS da Apple SEM validar a assinatura.
 *
 * A validação completa exige a cadeia de certificados da Apple (a raiz é
 * pública, mas conferi-la é um trabalho à parte). Aqui a garantia vem de outro
 * lugar, e é mais forte: o dado chegou por HTTPS DIRETO da API da Apple,
 * autenticado com a nossa chave privada. Ninguém no meio pode ter forjado.
 *
 * Isso NÃO valeria para uma notificação recebida por webhook, que chega sem
 * ser pedida — ali a assinatura é a única prova, e precisa ser conferida.
 */
function abrirPayload(jws: string): Record<string, unknown> | null {
  const partes = jws.split(".");
  if (partes.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(partes[1]!, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

async function consultar(
  base: string,
  transactionId: string,
  token: string,
): Promise<Response> {
  return fetch(`${base}/subscriptions/${encodeURIComponent(transactionId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Esta transação existe, é nossa, e está válida agora?
 *
 * Pergunta à produção e, se a Apple não conhecer, à sandbox. A ordem importa:
 * durante a REVISÃO do app a Apple testa com compras de sandbox, e um app que
 * só olha produção reprova com "não conseguimos assinar". Depois de publicado,
 * a produção responde primeiro e a sandbox nunca é consultada.
 */
export async function verificarTransacao(
  transactionId: string,
): Promise<ResultadoVerificacao> {
  const c = credenciais();
  if (!c) return { ok: false, motivo: "indisponivel" };

  let token: string;
  try {
    token = cracha(c);
  } catch (erro) {
    console.error("Não consegui assinar o token da App Store.", erro);
    return { ok: false, motivo: "indisponivel" };
  }

  for (const [ambiente, base] of [
    ["producao", ENDERECOS.producao],
    ["sandbox", ENDERECOS.sandbox],
  ] as const) {
    let resposta: Response;
    try {
      resposta = await consultar(base, transactionId, token);
    } catch (erro) {
      console.error(`Falha de rede falando com a Apple (${ambiente}).`, erro);
      return { ok: false, motivo: "indisponivel" };
    }

    // 404 aqui significa "esta transação não é deste ambiente", e não erro.
    if (resposta.status === 404) continue;

    if (!resposta.ok) {
      console.error(
        `App Store Server API devolveu ${resposta.status} (${ambiente}).`,
      );
      return { ok: false, motivo: "indisponivel" };
    }

    const corpo = (await resposta.json()) as {
      data?: { lastTransactions?: { signedTransactionInfo?: string }[] }[];
    };

    const assinado = corpo.data?.[0]?.lastTransactions?.[0]?.signedTransactionInfo;
    if (!assinado) return { ok: false, motivo: "nao_encontrada" };

    const info = abrirPayload(assinado);
    if (!info) return { ok: false, motivo: "invalida" };

    /*
     * O bundle id é conferido, e não é formalidade.
     *
     * Sem esta linha, um recibo legítimo de OUTRO app da Apple seria aceito
     * como assinatura da Mimu. É a checagem que separa "a Apple confirmou uma
     * compra" de "a Apple confirmou uma compra NOSSA".
     */
    if (info.bundleId !== c.bundleId) return { ok: false, motivo: "invalida" };

    const expira = Number(info.expiresDate ?? 0);
    if (!expira) return { ok: false, motivo: "invalida" };
    if (expira <= Date.now()) return { ok: false, motivo: "expirada" };

    return {
      ok: true,
      produtoId: String(info.productId ?? ""),
      expiraEm: new Date(expira),
      ambiente,
    };
  }

  return { ok: false, motivo: "nao_encontrada" };
}
