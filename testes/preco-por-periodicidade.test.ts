import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  PLANOS,
  valorDoPlano,
  periodicidadeValida,
  MESES_POR_PERIODICIDADE,
} from "@/lib/planos";

/**
 * O par frequência + valor, que não pode se separar.
 *
 * É o erro mais caro que existe neste código, nos dois sentidos: cobrar o
 * valor mensal com frequência de 12 meses dá à pessoa um ano pelo preço de
 * trinta dias; cobrar o valor anual com frequência de 1 mês debita doze vezes
 * o que devia — e essa a pessoa contesta no cartão.
 *
 * Sem rede, sem banco: são contas puras, e é justamente por serem simples que
 * ninguém olha duas vezes.
 */

describe("valor e frequência combinam", () => {
  it("mensal cobra o mês, anual cobra o ano", () => {
    expect(valorDoPlano("pro", "mensal")).toBe(PLANOS.pro.valorMensal);
    expect(valorDoPlano("pro", "anual")).toBe(PLANOS.pro.valorAnual);
    expect(valorDoPlano("premium", "mensal")).toBe(PLANOS.premium.valorMensal);
    expect(valorDoPlano("premium", "anual")).toBe(PLANOS.premium.valorAnual);
  });

  it("a frequência em meses acompanha a periodicidade", () => {
    expect(MESES_POR_PERIODICIDADE.mensal).toBe(1);
    expect(MESES_POR_PERIODICIDADE.anual).toBe(12);
  });

  it("o anual custa mais que o mensal, e menos que doze meses", () => {
    /*
     * A checagem de sanidade que pega inversão de campo. Se alguém trocar
     * valorMensal por valorAnual na tabela, os testes acima continuam
     * passando (comparam a tabela consigo mesma) — este não.
     */
    for (const plano of ["pro", "premium"] as const) {
      const mensal = PLANOS[plano].valorMensal;
      const anual = PLANOS[plano].valorAnual!;

      expect(anual, `${plano}: anual deveria custar mais que um mês`)
        .toBeGreaterThan(mensal);
      expect(anual, `${plano}: anual deveria dar desconto sobre 12 meses`)
        .toBeLessThan(mensal * 12);
    }
  });

  it("periodicidade inválida não vira anual por acidente", () => {
    for (const lixo of ["ANUAL", "anual ", "yearly", "", "12", null, undefined]) {
      expect(periodicidadeValida(lixo), String(lixo)).toBeNull();
    }
    expect(periodicidadeValida("anual")).toBe("anual");
    expect(periodicidadeValida("mensal")).toBe("mensal");
  });

  it("combinação não vendida devolve null, e não o mensal", () => {
    /*
     * `valorDoPlano` cai para null de propósito quando um plano não tem preço
     * anual. Cair no mensal cobraria um doze avos e marcaria a renovação para
     * daqui a um ano — a pessoa pagaria R$ 39 por doze meses de Premium.
     */
    const semAnual = { ...PLANOS.pro, valorAnual: null };
    expect(semAnual.valorAnual).toBeNull();
  });
});

/*
 * O PIX TEM QUE COBRAR O PERÍODO QUE A TELA ANUNCIA.
 *
 * Cobrava sempre a mensalidade: quem escolhia "Anual" via "R$ 399,90 cobrados
 * uma vez por ano", clicava em Pagar com Pix e recebia um Pix de R$ 39,90 que
 * liberava um mês. O cartão sempre esteve certo; o erro era só do Pix, e nada
 * acusava, porque a tabela de preços acima estava correta — quem ignorava a
 * periodicidade era a rota.
 *
 * Os testes leem o código como texto porque a rota fala com o Mercado Pago e
 * com o banco. O que se garante é o formato da decisão, nos dois lados.
 */
describe("o Pix cobra e libera o período escolhido", () => {
  const ler = (arquivo: string) =>
    readFileSync(join(process.cwd(), arquivo), "utf8");

  it("a rota cobra o valor da periodicidade, e não a mensalidade", () => {
    const rota = ler("app/api/pagamento/pix/route.ts");
    expect(rota).toContain("valorDoPlano(plano, periodicidade)");
    expect(rota).toContain("transaction_amount: valor,");
    expect(rota, "a rota voltou a cobrar a mensalidade direto").not.toMatch(
      /transaction_amount:\s*valorMensal/,
    );
  });

  it("o período vai gravado na cobrança, e o webhook libera o que foi pago", () => {
    // Se o webhook lesse o período da assinatura, dava para gerar o Pix
    // mensal, trocar para anual e ganhar doze meses pagando um.
    expect(ler("app/api/pagamento/pix/route.ts")).toContain(
      "metadata: { periodicidade }",
    );
    const webhook = ler("app/api/pagamento/webhook/route.ts");
    expect(webhook).toContain("periodoCobrado(pagamentoMP)");
    expect(
      webhook,
      "o webhook voltou a ativar sem o período — cai no mensal",
    ).not.toMatch(/ativarAssinatura\(supabase, pagamento\.assinatura_id\)/);
  });
});
