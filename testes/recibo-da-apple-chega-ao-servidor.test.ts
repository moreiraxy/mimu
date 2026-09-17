import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

/**
 * A compra da Apple precisa virar acesso, e quem libera acesso é o servidor.
 *
 * Este teste existe por causa de um defeito que atravessou TRÊS envios à App
 * Store sem ser notado. `comprar()` e `restaurar()` devolvem o `transactionId`
 * — o recibo — e a tela o descartava: chamava `router.refresh()` e pronto.
 *
 * O efeito, medido em 17/09/2026 com uma compra real em sandbox: a Apple
 * registrou a assinatura, cobrou (em teste), e o nosso banco não tinha linha
 * nenhuma. Nem em `pagamentos`, nem em `assinaturas`. Em produção isso é
 * cliente pagando e não recebendo.
 *
 * A rota /api/pagamento/apple existia INTEIRA, com credenciais no ambiente e
 * verificação contra a App Store Server API. Era código morto: nada a chamava.
 * Foi por isso que ninguém percebeu — havia código demais para parecer
 * incompleto.
 */

const TELA = "app/(dashboard)/minha-empresa/PlanoSection.tsx";
const ROTA = "app/api/pagamento/apple/route.ts";

describe("o recibo da Apple chega ao servidor", () => {
  it("a tela de assinatura chama a rota de pagamento da Apple", () => {
    const tela = readFileSync(TELA, "utf8");
    expect(
      tela,
      "Nada na tela chama /api/pagamento/apple. Sem isso a compra acontece na " +
        "Apple e o acesso nunca é liberado: a pessoa paga e não recebe.",
    ).toContain("/api/pagamento/apple");
  });

  it("o transactionId sai do plugin e entra na chamada", () => {
    const tela = readFileSync(TELA, "utf8");
    // O recibo é o único elo entre a compra e o servidor. Se a tela não o
    // menciona, ela está descartando o que a Apple devolveu.
    expect(
      tela,
      "a tela não usa o transactionId devolvido pelo plugin",
    ).toContain("transactionId");
  });

  it("a rota que recebe o recibo continua existindo", () => {
    // O teste acima passaria com uma chamada para uma rota inexistente.
    const rota = readFileSync(ROTA, "utf8");
    expect(rota).toContain("verificarTransacao");
  });

  it("restaurar compras também confirma no servidor", () => {
    const tela = readFileSync(TELA, "utf8");
    const i = tela.indexOf("async function restaurarCompras");
    expect(i, "restaurarCompras sumiu da tela").toBeGreaterThan(-1);

    // Recorta a função pelo início da próxima declaração no mesmo nível.
    const resto = tela.slice(i);
    const fim = resto.indexOf("\n  async function", 10);
    const corpo = fim > 0 ? resto.slice(0, fim) : resto;

    expect(
      corpo,
      "restaurarCompras não manda o recibo ao servidor. Este é o único " +
        "caminho de quem trocou de aparelho ou reinstalou — sem ele, " +
        '"Restaurar compras" é um botão que não restaura.',
    ).toContain("confirmarNoServidor");
  });
});
