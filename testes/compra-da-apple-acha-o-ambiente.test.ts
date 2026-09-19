import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateKeyPairSync } from "node:crypto";
import { verificarTransacao } from "@/lib/apple-store-server";

/**
 * A compra do revisor da Apple, que acontece em SANDBOX.
 *
 * Enquanto o app não está publicado, a produção responde 401 a qualquer
 * pergunta: ela não conhece o bundle ainda. Medido em 10/09/2026 contra a API
 * de verdade, com a chave real — produção 401, sandbox 400 "Invalid
 * transaction id", ou seja, sandbox ACEITOU o crachá e processou a chamada.
 *
 * Como produção é consultada primeiro, desistir no primeiro tropeço fazia a
 * verificação nunca chegar ao sandbox. A compra do revisor morria em "não
 * consegui falar com a App Store" e a revisão reprovava — justamente o
 * caminho que precisava funcionar.
 *
 * Sem rede: o fetch é trocado. O que está sob teste é a decisão de continuar,
 * não a Apple.
 */

// Chave EC válida gerada na hora: o assinador exige PKCS#8 de verdade, e
// embutir uma chave real num teste seria vazá-la.
const { privateKey } = generateKeyPairSync("ec", {
  namedCurve: "P-256",
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});

const b64u = (v: unknown) =>
  Buffer.from(JSON.stringify(v)).toString("base64url");

/** Um JWS como o da Apple. A assinatura não é conferida — ver abrirPayload. */
function recibo(campos: Record<string, unknown>) {
  return `${b64u({ alg: "ES256" })}.${b64u(campos)}.assinatura`;
}

function respostaCom(assinado: string) {
  return new Response(
    JSON.stringify({
      data: [{ lastTransactions: [{ signedTransactionInfo: assinado }] }],
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

const ehProducao = (url: string) => url.includes("//api.storekit.itunes");

beforeEach(() => {
  process.env.APPLE_ISSUER_ID = "11111111-2222-3333-4444-555555555555";
  process.env.APPLE_KEY_ID = "ABCDE12345";
  process.env.APPLE_PRIVATE_KEY = privateKey as string;
  process.env.APPLE_BUNDLE_ID = "br.com.mimu.app";
  // O aviso de 401 é proposital no código; não queremos ele sujando a saída.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("a verificação não desiste no primeiro ambiente", () => {
  it("produção recusando com 401 não impede o sandbox de responder", async () => {
    const assinado = recibo({
      bundleId: "br.com.mimu.app",
      productId: "br.com.mimu.app.pro.mensal",
      expiresDate: Date.now() + 30 * 24 * 60 * 60 * 1000,
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        ehProducao(String(url))
          ? new Response("", { status: 401 })
          : respostaCom(assinado),
      ),
    );

    const r = await verificarTransacao("2000000000000000");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.ambiente).toBe("sandbox");
      expect(r.produtoId).toBe("br.com.mimu.app.pro.mensal");
    }
  });

  it("sem credenciais no ambiente, o motivo é próprio e não 'indisponivel'", async () => {
    /*
     * Os dois já produziram a MESMA frase, e isso custou um ciclo de deploy em
     * 17/09/2026: a compra falhava e não dava para saber, de fora, se faltava
     * variável no servidor ou se a Apple tinha recusado.
     */
    const guardado = process.env.APPLE_PRIVATE_KEY;
    delete process.env.APPLE_PRIVATE_KEY;

    // Sem rede: a falta de credencial é decidida antes de qualquer fetch.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 200 })),
    );

    const r = await verificarTransacao("2000000000000000");
    process.env.APPLE_PRIVATE_KEY = guardado;

    expect(r).toEqual({ ok: false, motivo: "nao_configurado" });
  });

  it("chave ilegível também é configuração, e não indisponibilidade", async () => {
    /*
     * O caso real: APPLE_PRIVATE_KEY colada no painel da hospedagem com as
     * quebras de linha perdidas. A variável EXISTE, então a checagem de
     * presença passa, e a falha só aparece na hora de assinar o JWT.
     *
     * Isso devolvia "indisponivel" — mandando tentar de novo para um problema
     * que nunca passa sozinho.
     */
    const guardada = process.env.APPLE_PRIVATE_KEY;
    process.env.APPLE_PRIVATE_KEY =
      "-----BEGIN PRIVATE KEY----- nao sou uma chave";

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 200 })),
    );

    const r = await verificarTransacao("2000000000000000");
    process.env.APPLE_PRIVATE_KEY = guardada;

    expect(r).toEqual({ ok: false, motivo: "nao_configurado" });
  });

  it("os dois ambientes tropeçando vira indisponível, não 'não encontrada'", async () => {
    // A diferença importa: "não encontrada" manda a pessoa restaurar compras,
    // e não há o que restaurar quando o problema é nosso.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 500 })),
    );

    const r = await verificarTransacao("2000000000000000");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.motivo).toBe("indisponivel");

    // O que cada ambiente respondeu viaja junto: é o que separa "401 nos
    // dois" de "404 no sandbox", e cada um aponta para um conserto diferente.
    expect(r.porAmbiente?.producao).toContain("500");
    expect(r.porAmbiente?.sandbox).toContain("500");
  });

  it("404 nos dois é resposta, não falha: a transação não existe mesmo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("", { status: 404 })),
    );

    const r = await verificarTransacao("2000000000000000");
    expect(r).toEqual({ ok: false, motivo: "nao_encontrada" });
  });

  it("produção respondendo encerra a busca sem consultar o sandbox", async () => {
    const assinado = recibo({
      bundleId: "br.com.mimu.app",
      productId: "br.com.mimu.app.premium.anual",
      expiresDate: Date.now() + 365 * 24 * 60 * 60 * 1000,
    });
    const espiao = vi.fn(async () => respostaCom(assinado));
    vi.stubGlobal("fetch", espiao);

    const r = await verificarTransacao("2000000000000000");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.ambiente).toBe("producao");
    expect(espiao).toHaveBeenCalledTimes(1);
  });

  it("recibo de outro app é recusado mesmo vindo assinado da Apple", async () => {
    const assinado = recibo({
      bundleId: "com.outra.empresa",
      productId: "qualquer",
      expiresDate: Date.now() + 60_000,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => respostaCom(assinado)),
    );

    const r = await verificarTransacao("2000000000000000");
    expect(r).toEqual({ ok: false, motivo: "invalida" });
  });
});
