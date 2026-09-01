import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/*
 * Toda variável NEXT_PUBLIC_ que o código usa precisa estar no .env.production.
 *
 * POR QUE NÃO BASTA DEFINIR NO PAINEL. Variável `NEXT_PUBLIC_` não é lida
 * quando o site roda: ela é GRAVADA dentro do JavaScript na hora de compilar.
 * E a Hostinger entrega as variáveis do painel ao processo em execução, não ao
 * build. Então o que vale, para essas, é o que está neste arquivo — que vai no
 * repositório e por isso está presente na compilação.
 *
 * O sintoma quando falta é mudo, e foi assim que apareceu: a seção "Mimu no
 * WhatsApp" simplesmente não existia na tela. Sem erro no build, sem erro no
 * navegador, sem nada no log. O valor era `undefined`, o componente devolvia
 * nada, e nada é indistinguível de nada.
 *
 * Cinco variáveis estavam no arquivo e funcionavam. A sexta, acrescentada
 * depois e só no painel, não. A diferença entre elas era invisível.
 *
 * Só cabem aqui valores públicos — eles vão para o navegador de todo visitante
 * de qualquer forma. Segredo continua exclusivamente no painel, e é por isso
 * que este teste olha apenas o prefixo NEXT_PUBLIC_.
 */

const RAIZ = process.cwd();

/** Varre o código atrás de `process.env.NEXT_PUBLIC_ALGUMA_COISA`. */
function usadasNoCodigo(): Set<string> {
  const achadas = new Set<string>();
  const padrao = /process\.env\.(NEXT_PUBLIC_[A-Z0-9_]+)/g;

  function varrer(dir: string) {
    for (const nome of readdirSync(dir)) {
      const caminho = join(dir, nome);
      if (statSync(caminho).isDirectory()) {
        if (nome === "node_modules" || nome.startsWith(".")) continue;
        varrer(caminho);
        continue;
      }
      if (!/\.(ts|tsx)$/.test(nome)) continue;

      const conteudo = readFileSync(caminho, "utf8");
      for (const achado of conteudo.matchAll(padrao)) achadas.add(achado[1]!);
    }
  }

  for (const pasta of ["app", "lib", "components", "hooks"]) {
    try {
      varrer(join(RAIZ, pasta));
    } catch {
      // Pasta que não existe neste projeto — nada a varrer.
    }
  }

  return achadas;
}

/**
 * As que o próprio next.config.mjs injeta no build, pelo bloco `env`.
 *
 * Estas não precisam do .env.production, e o motivo é o mesmo que justifica o
 * teste inteiro: o problema que ele existe para pegar é variável que só existe
 * no painel da hospedagem e por isso nunca chega à compilação. Uma variável
 * escrita no next.config.mjs chega à compilação por definição — ela É a
 * compilação. Exigir que ela também esteja no .env.production obrigaria a
 * repetir o valor à mão nos dois lugares, e o dia em que os dois discordassem
 * o arquivo é que estaria mentindo.
 */
function injetadasNoBuild(): Set<string> {
  const conteudo = readFileSync(join(RAIZ, "next.config.mjs"), "utf8");
  const bloco = conteudo.match(/\benv:\s*\{([\s\S]*?)\}/);
  const achadas = new Set<string>();
  if (!bloco) return achadas;
  for (const [, nome] of bloco[1]!.matchAll(/(NEXT_PUBLIC_[A-Z0-9_]+)\s*:/g)) {
    achadas.add(nome!);
  }
  return achadas;
}

function declaradasNoArquivo(): Set<string> {
  const conteudo = readFileSync(join(RAIZ, ".env.production"), "utf8");
  const nomes = conteudo.matchAll(/^(NEXT_PUBLIC_[A-Z0-9_]+)=(.*)$/gm);
  const declaradas = new Set<string>();
  for (const [, nome, valor] of nomes) {
    // Declarada e vazia é pior que ausente: parece resolvida.
    if (valor?.trim()) declaradas.add(nome!);
  }
  return declaradas;
}

describe("as variáveis públicas", () => {
  it("estão todas no .env.production", () => {
    const usadas = [...usadasNoCodigo()].sort();
    const declaradas = declaradasNoArquivo();
    const injetadas = injetadasNoBuild();

    const faltando = usadas.filter(
      (v) => !declaradas.has(v) && !injetadas.has(v),
    );

    expect(
      faltando,
      "Estas variáveis NEXT_PUBLIC_ são usadas no código mas não estão no " +
        ".env.production com valor. Definir só no painel da hospedagem NÃO " +
        "resolve: elas são gravadas na compilação, e o painel só alcança o app " +
        "em execução. O sintoma é mudo — o valor vira `undefined` e a tela que " +
        `depende dele some sem erro nenhum.\n  ${faltando.join("\n  ")}`,
    ).toEqual([]);
  });

  it("não sobra no arquivo o que ninguém usa", () => {
    const usadas = usadasNoCodigo();
    const sobrando = [...declaradasNoArquivo()].filter((v) => !usadas.has(v));

    expect(
      sobrando,
      "Estas estão no .env.production e ninguém lê. Provavelmente sobraram de " +
        `algo removido — vale apagar para o arquivo continuar legível.\n  ${sobrando.join("\n  ")}`,
    ).toEqual([]);
  });
});
