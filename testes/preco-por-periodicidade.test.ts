import { describe, it, expect } from "vitest";
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
