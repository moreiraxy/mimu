import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * O silenciador de console é para o NAVEGADOR, e só.
 *
 * Um módulo "use client" também roda no servidor durante a renderização. Sem a
 * guarda de `typeof window`, ele apagava o `console.error` do processo Node — e
 * com ele todo erro de servidor do produto sumia do log de produção: a Groq
 * recusando, a transcrição falhando, o push sem chave. Ficou assim por meses,
 * e o próprio silêncio era o que impedia de descobrir.
 *
 * O teste lê o arquivo em vez de executar o módulo porque o efeito é no
 * carregamento: importá-lo aqui apagaria o console do próprio Vitest.
 */
describe("silenciador de console", () => {
  const fonte = readFileSync(
    join(process.cwd(), "components/providers/SilenciarConsoleProducao.tsx"),
    "utf-8",
  );

  it("só apaga o console quando existe um navegador", () => {
    const linhaDaGuarda = fonte
      .split("\n")
      .find((l) => l.includes("console.log = ") || l.includes("console.error = "));
    expect(linhaDaGuarda, "o silenciador sumiu do arquivo").toBeTruthy();

    /*
     * A guarda tem que estar no MESMO `if` que envolve as atribuições. Um
     * `typeof window` solto em qualquer lugar do arquivo passaria num teste
     * mais frouxo sem proteger nada.
     */
    const condicao = fonte.slice(0, fonte.indexOf("console.log = "));
    const ultimoIf = condicao.lastIndexOf("if (");
    expect(ultimoIf, "as atribuições não estão dentro de um if").toBeGreaterThan(-1);

    const guarda = condicao.slice(ultimoIf);
    expect(
      guarda.includes('typeof window !== "undefined"'),
      "falta a guarda de navegador: isto apaga o log de erro do SERVIDOR em produção",
    ).toBe(true);
  });
});
