import { cp, mkdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Leva a landing page compilada (site-mimo, um projeto Vite separado) para
 * dentro do public/ do Next, que é quem vai servi-la em produção.
 *
 * Por que na RAIZ e não numa subpasta: a LP referencia imagem por caminho
 * absoluto em 103 lugares (`/img/...`). Servida de `/lp/`, toda imagem
 * quebraria — e reescrever os 103 seria trocar um problema por outro.
 *
 * O index.html vai para `public/lp.html` em vez de `public/index.html`
 * porque o Next não serve `public/index.html` na raiz; quem manda `/` para
 * ela é o rewrite em next.config.mjs.
 */
const RAIZ = path.resolve(import.meta.dirname, "..");
const DIST = path.join(RAIZ, "site-mimo", "dist");
const PUBLIC = path.join(RAIZ, "public");

// Pastas que pertencem inteiramente à LP: são apagadas antes de copiar, senão
// um asset renomeado no build de hoje conviveria com o de ontem para sempre.
const PASTAS_DA_LP = ["assets", "img"];

if (!existsSync(DIST)) {
  console.error(
    "site-mimo/dist não existe. Rode o build da LP antes (npm run build:lp).",
  );
  process.exit(1);
}

for (const pasta of PASTAS_DA_LP) {
  await rm(path.join(PUBLIC, pasta), { recursive: true, force: true });
  const origem = path.join(DIST, pasta);
  if (existsSync(origem)) {
    await cp(origem, path.join(PUBLIC, pasta), { recursive: true });
  }
}

// fonts/ é o único diretório compartilhado com o app (Nunito e Space Grotesk
// moram lá), então nunca é apagado — só recebe a subpasta da landing.
//
// Copia SÓ fonts/marca/, e não a pasta inteira: o site-mimo herdou do clone
// original um punhado de .woff2 soltos que nenhum CSS referencia. Levá-los
// junto engordaria o deploy com fonte que ninguém baixa.
const fontesDaMarca = path.join(DIST, "fonts", "marca");
if (existsSync(fontesDaMarca)) {
  const destino = path.join(PUBLIC, "fonts", "marca");
  await rm(destino, { recursive: true, force: true });
  await mkdir(path.dirname(destino), { recursive: true });
  await cp(fontesDaMarca, destino, { recursive: true });
}

await cp(path.join(DIST, "index.html"), path.join(PUBLIC, "lp.html"));

// De propósito NÃO copia o icon.svg da LP: o Next já serve /icon.svg a partir
// de app/icon.svg, e ter os dois faz o Next reclamar de rota duplicada.

const { size } = await stat(path.join(PUBLIC, "lp.html"));
console.log(`landing page copiada para public/ (lp.html: ${size} bytes)`);
