import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/**
 * A guarda da diretriz 3.1.1 não pode bloquear a rota que a implementa.
 *
 * O middleware barra, dentro do app iOS, tudo que leve ao checkout próprio —
 * inclusive por POST direto, porque bloquear só a tela não bastaria. A lista é
 * por prefixo, e `/api/pagamento` pega TUDO que vem abaixo dela.
 *
 * Inclusive `/api/pagamento/apple`, que é o oposto do que a guarda quer
 * impedir: é ela que recebe o recibo da App Store e transforma a compra pelo
 * IAP em acesso. Só é chamada de dentro do app.
 *
 * Em 17/09/2026, com uma compra real em sandbox, o resultado foi este: a
 * assinatura comprada, a cobrança feita, e o recibo batendo em 403 no próprio
 * middleware. A pessoa pagava e não recebia — pela guarda que existe
 * justamente para a Apple aprovar o app.
 */

const MIDDLEWARE = "lib/supabase/middleware.ts";

describe("o recibo da Apple atravessa o bloqueio de pagamento próprio", () => {
  it("a rota do IAP está explicitamente liberada", () => {
    const fonte = readFileSync(MIDDLEWARE, "utf8");
    expect(
      fonte,
      "sem a exceção, /api/pagamento/apple cai no bloqueio por prefixo de " +
        "/api/pagamento e o recibo nunca chega ao servidor",
    ).toContain("/api/pagamento/apple");
  });

  it("a exceção é usada na condição, e não só declarada", () => {
    const fonte = readFileSync(MIDDLEWARE, "utf8");
    const i = fonte.indexOf("ROTAS_DE_PAGAMENTO_PROPRIO)");
    expect(i, "o bloqueio por rota sumiu do middleware").toBeGreaterThan(-1);

    // A checagem da exceção precisa estar na MESMA condição do bloqueio.
    const condicao = fonte.slice(Math.max(0, i - 220), i + 40);
    expect(
      condicao,
      "a constante existe mas a condição do bloqueio não a consulta",
    ).toMatch(/ROTA_DO_IAP|\/api\/pagamento\/apple/);
  });

  it("o checkout próprio continua bloqueado", () => {
    const fonte = readFileSync(MIDDLEWARE, "utf8");
    // Se alguém "resolver" liberando /api/pagamento inteiro, o app volta a
    // poder pagar por fora do IAP — e isso é reprovação na diretriz 3.1.1.
    expect(fonte).toContain('"/api/pagamento"');
    expect(fonte).toContain('"/assinar"');
  });
});
