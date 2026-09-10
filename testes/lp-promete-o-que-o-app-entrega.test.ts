import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MENSAGENS_MIMU_POR_DIA, PLANOS } from "@/lib/planos";

/*
 * A landing page não pode prometer o que o app não entrega.
 *
 * A landing é um projeto Vite separado (site-mimo), servido em "/" por uma
 * reescrita do next.config. Ela não importa de lib/planos.ts — tem o próprio
 * arquivo de planos, escrito à mão. Duas listas de preço no mesmo repositório,
 * e só uma manda no que é cobrado e no que é liberado.
 *
 * ISSO JÁ DEU ERRADO. Os cartões anunciavam "Conversas ilimitadas com a Mimu"
 * no Pro e no Premium enquanto o app cortava a conversa por cota diária. E o
 * erro era invisível dos dois lados: quem lesse lib/planos.ts via o teto certo,
 * quem lesse a landing via uma promessa coerente, e ninguém lia os dois juntos.
 *
 * A falha aparecia na cliente — a que pagou por "ilimitado" e ouviu "por hoje
 * é só". É o pior lugar para uma divergência de código aparecer.
 *
 * Este teste lê a landing como texto e exige que os números do app estejam lá.
 * Não valida a frase inteira: a redação é da Rayssa e pode mudar. O que ele
 * garante é que o NÚMERO exibido é o número cobrado, e que a palavra
 * "ilimitad*" não volta enquanto existir cota.
 */

const CARTOES = readFileSync(
  join(process.cwd(), "site-mimo/src/sections/PricingV2.tsx"),
  "utf8",
);

/*
 * Só o bloco dos planos. O arquivo inteiro tem comentários que falam do erro
 * antigo — inclusive a palavra "ilimitadas", citada para explicar o que não
 * pode voltar. Buscar no arquivo todo faria o teste falhar por causa da
 * própria documentação dele.
 */
const BLOCO_PLANOS = (() => {
  const inicio = CARTOES.indexOf("const PLANOS = [");
  const fim = CARTOES.indexOf("] as const;", inicio);
  expect(
    inicio >= 0 && fim > inicio,
    "não achei o bloco `const PLANOS = [ ... ] as const;` na landing",
  ).toBe(true);
  return CARTOES.slice(inicio, fim);
})();

describe("a landing promete o que o app entrega", () => {
  it("mostra o teto de mensagens de cada plano", () => {
    for (const [plano, teto] of [
      ["Grátis", MENSAGENS_MIMU_POR_DIA.free],
      ["Pro", MENSAGENS_MIMU_POR_DIA.pro],
      ["Premium", MENSAGENS_MIMU_POR_DIA.premium],
    ] as const) {
      expect(
        BLOCO_PLANOS,
        `A landing não diz "${teto} mensagens por dia" no plano ${plano}. ` +
          `O app corta em ${teto} (MENSAGENS_MIMU_POR_DIA em lib/planos.ts). ` +
          `Conserto: atualize site-mimo/src/sections/PricingV2.tsx.`,
      ).toContain(`${teto} mensagens por dia`);
    }
  });

  it("não promete conversa ilimitada, porque não existe", () => {
    expect(
      /ilimitad/i.test(BLOCO_PLANOS),
      'A landing voltou a prometer algo "ilimitado" com a Mimu. ' +
        "Toda conta tem cota diária — inclusive a Premium.",
    ).toBe(false);
  });

  /**
   * Como o mesmo valor pode aparecer escrito na landing.
   *
   * O código guarda número; a landing escreve dinheiro. `1989.9` vira
   * "R$ 1.989,90" em português — com ponto de milhar e vírgula decimal —,
   * enquanto o JavaScript cru diria "R$ 1989.9". Comparar a forma crua
   * funcionou enquanto todo preço era inteiro e redondo, e quebrou no dia em
   * que os centavos entraram (eles vêm das faixas da App Store; ver
   * lib/planos.ts).
   *
   * Devolve as duas grafias aceitáveis porque um preço redondo pode ser
   * escrito "R$ 39" ou "R$ 39,00", e as duas estão certas. O que o teste
   * garante é o VALOR, não a pontuação.
   */
  function grafias(valor: number): string[] {
    return [
      `R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      `R$ ${valor.toLocaleString("pt-BR")}`,
    ];
  }

  it("cobra o preço que o checkout cobra", () => {
    for (const chave of ["pro", "premium"] as const) {
      const { valorMensal, valorAnual } = PLANOS[chave];

      expect(
        grafias(valorMensal).some((g) => BLOCO_PLANOS.includes(g)),
        `A landing não mostra o mensal de ${chave} (${grafias(valorMensal)[0]}).`,
      ).toBe(true);

      expect(
        grafias(valorAnual!).some((g) => BLOCO_PLANOS.includes(g)),
        `A landing não mostra o anual de ${chave} (${grafias(valorAnual!)[0]}).`,
      ).toBe(true);
    }
  });
});
