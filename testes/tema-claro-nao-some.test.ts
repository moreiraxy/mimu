import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/*
 * Branco fixo é invisível no tema claro.
 *
 * O app foi desenhado no escuro, e durante a padronização eu usei `white/x`
 * para todo preenchimento sutil e todo fio de separação — 49 lugares. No
 * escuro fica certo; no claro some tudo: os fios das listas, os trilhos das
 * barras, o fundo dos campos, o anel dos cartões. A saudação do painel chegou
 * a ser `text-white` puro, ou seja, texto branco sobre fundo claro.
 *
 * O remédio é o token `escuro`, que é a cor do TEXTO e inverte com o tema:
 * branco no escuro (idêntico ao que era) e quase preto no claro.
 *
 * Este teste existe porque um app dark-first convida ao erro toda vez que
 * alguém escreve uma tela nova — e quem escreve raramente abre o tema claro
 * para conferir.
 */

const RAIZ = process.cwd();

/**
 * Fundos de cor FIXA. Texto branco sobre eles é correto nos dois temas — um
 * selo vermelho de alerta é vermelho no claro e no escuro.
 */
const FUNDO_FIXO = /bg-(erro|ambar|verde|primary|escuro)\b|bg-\[#/;

/** Onde o branco é correto e o fundo fixo está em outra linha. */
const PERMITIDO = new Map<string, string>([
  [
    "app/(dashboard)/minha-empresa/page.tsx",
    "banner SEJA PRO: o fundo #111111 está no elemento pai, não na mesma linha",
  ],
]);

/**
 * Tira comentários antes de olhar.
 *
 * Sem isso o teste acusa o próprio aviso escrito no código — o comentário que
 * diz "use `text-escuro`, e NUNCA `text-white`" seria lido como o defeito que
 * ele existe para evitar.
 */
function semComentarios(fonte: string): string[] {
  const sem = fonte
    .replace(/\/\*[\s\S]*?\*\//g, (bloco) => bloco.replace(/[^\n]/g, " "))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, antes) => antes);
  return sem.split("\n");
}

function arquivosDe(dir: string, achados: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      if (nome === "node_modules") continue;
      arquivosDe(caminho, achados);
    } else if (nome.endsWith(".tsx")) {
      achados.push(caminho);
    }
  }
  return achados;
}

describe("tema claro", () => {
  it("não usa branco fixo onde a cor precisa inverter", () => {
    const arquivos = [
      ...arquivosDe(join(RAIZ, "app")),
      ...arquivosDe(join(RAIZ, "components")),
    ];

    const problemas: string[] = [];

    for (const caminho of arquivos) {
      const relativo = caminho.slice(RAIZ.length + 1);

      // A landing e o marketing são escuros SEMPRE — não têm tema claro.
      if (relativo.includes("(marketing)") || relativo.includes("marketing/")) {
        continue;
      }
      if (PERMITIDO.has(relativo)) continue;

      for (const [i, linha] of semComentarios(
        readFileSync(caminho, "utf-8"),
      ).entries()) {
        /*
         * `bg-white/`, `border-white/` e `divide-white/` são SEMPRE o defeito:
         * são preenchimentos e fios sutis, feitos para aparecer sobre escuro.
         * Sobre claro, somem.
         */
        const sutil = linha.match(/\b(?:bg|border|divide)-white\/[\w[\].]+/g);
        if (sutil) {
          problemas.push(
            `${relativo}:${i + 1} → ${[...new Set(sutil)].join(", ")}`,
          );
        }

        // `text-white` só é defeito quando NÃO há um fundo de cor fixa junto.
        if (/\btext-white\b/.test(linha) && !FUNDO_FIXO.test(linha)) {
          problemas.push(
            `${relativo}:${i + 1} → text-white sem fundo de cor fixa`,
          );
        }
      }
    }

    expect(
      problemas,
      "Branco fixo some no tema claro. Use o token `escuro`, que inverte " +
        "(bg-escuro/[0.06], border-escuro/[0.08], text-escuro). Se o branco " +
        "for correto ali — texto sobre botão vermelho, superfície escura fixa " +
        "—, acrescente o arquivo ao mapa PERMITIDO com o motivo:\n" +
        problemas.map((p) => `  - ${p}`).join("\n"),
    ).toEqual([]);
  });
});
