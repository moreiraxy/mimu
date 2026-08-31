#!/usr/bin/env node
/*
 * Empacota o worker do WhatsApp num arquivo JavaScript só.
 *
 *   npm run build:worker   →   dist-worker/whatsapp.js
 *
 * POR QUE ISTO EXISTE. Em desenvolvimento o worker roda por `tsx`, que lê
 * TypeScript direto. Hospedagem gerenciada não trabalha assim: ela pede um
 * ARQUIVO DE ENTRADA em JavaScript e o executa com o node puro. Sem este passo,
 * o app subiria e morreria na primeira linha, com um erro de sintaxe em cima de
 * um `import type` — mensagem que não ajuda ninguém a entender que o problema é
 * a linguagem, não o código.
 *
 * O QUE ENTRA NO PACOTE: só o nosso código, com os caminhos `@/...` resolvidos.
 * As dependências ficam de fora, em node_modules, e é de propósito — o Baileys
 * carrega binário nativo e módulos opcionais em tempo de execução, e empacotar
 * isso junto quebra de formas difíceis de diagnosticar (o sintoma clássico é o
 * envio de mídia falhar só em produção). Quem instala continua sendo o
 * `npm install` da plataforma, como em qualquer projeto Node.
 */

import { build } from "esbuild";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), "..");

/*
 * O alias `@/` sai do tsconfig, e não de uma cópia escrita aqui.
 *
 * Duas listas do mesmo caminho divergem no dia em que alguém mexe numa só, e
 * o sintoma seria um import que resolve no editor e falha no pacote.
 */
const tsconfig = JSON.parse(
  readFileSync(join(RAIZ, "tsconfig.json"), "utf8").replace(
    // tsconfig aceita comentários; JSON.parse não.
    /^\s*\/\/.*$/gm,
    "",
  ),
);

const paths = tsconfig.compilerOptions?.paths?.["@/*"];
if (!paths?.length) {
  console.error("Não achei o alias @/* em tsconfig.json. O pacote sairia com imports quebrados.");
  process.exit(1);
}

const destinoDoAlias = join(RAIZ, paths[0].replace(/\/\*$/, ""));

await build({
  entryPoints: [join(RAIZ, "worker/whatsapp/index.ts")],
  /*
   * O destino é configurável só para o teste poder construir numa pasta
   * temporária e comparar com o que está versionado. Em uso normal, o padrão.
   */
  outfile: process.env.SAIDA_WORKER ?? join(RAIZ, "dist-worker/whatsapp.js"),
  bundle: true,
  platform: "node",
  /*
   * CommonJS, e isto foi aprendido quebrando.
   *
   * Empacotar em ESM parecia mais moderno e falhou de um jeito instrutivo: o
   * Baileys é publicado em CommonJS, e na conversão o `makeWASocket` deixava de
   * ser função e virava propriedade de um objeto. O worker subia, abria a porta,
   * anunciava "conectando" e morria com `makeWASocket is not a function` — três
   * linhas de sucesso antes do erro, que é o pior formato de falha.
   *
   * O `tsx` escondia isso em desenvolvimento porque resolve a interoperabilidade
   * por conta própria. Empacotar no MESMO formato da dependência elimina a
   * conversão, e com ela a classe inteira de problema.
   */
  format: "cjs",
  target: "node18",
  packages: "external",
  sourcemap: true,
  // O nome do arquivo aparece nas pilhas de erro do log da hospedagem; sem
  // isto elas apontariam para um `stdin` sem sentido.
  sourcesContent: false,
  alias: { "@": destinoDoAlias },
  logLevel: "info",
  banner: {
    js: [
      "// Gerado por scripts/construir-worker.mjs — não edite à mão.",
      "// A fonte é worker/whatsapp/index.ts.",
    ].join("\n"),
  },
});

console.log("worker empacotado em dist-worker/whatsapp.js");
