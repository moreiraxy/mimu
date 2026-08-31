import { readFile, writeFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Gera um HTML por rota da landing, com o texto já dentro.
 *
 * A landing é uma SPA: o HTML do Vite tem `<div id="root"></div>` e mais nada,
 * e o conteúdo só aparece depois que o React roda no navegador. Buscador não
 * roda o React — então a página que ele lia era literalmente vazia. Medido:
 * zero caractere de texto no HTML cru contra 6.806 na página renderizada.
 *
 * Este script roda DEPOIS dos dois builds do Vite (o do navegador e o de
 * servidor), monta cada rota com React fora do navegador e escreve o resultado
 * dentro do template. Não sobe nada em produção: o que vai para o Railway
 * continua sendo arquivo estático.
 *
 * Cada rota vira arquivo próprio porque as quatro apontavam para o mesmo
 * `lp.html` — prerenderizar sem separar daria a mesma página para todas, e a
 * história do Salão da Andréia seria indexada com o texto da home.
 */

const RAIZ = path.resolve(import.meta.dirname, "..");
const DIST = path.join(RAIZ, "dist");
const DIST_SSR = path.join(RAIZ, "dist-ssr");

const { render, STORIES, LEGAL } = await import(
  pathToFileURL(path.join(DIST_SSR, "entry-ssr.js")).href
);

/*
 * O endereço oficial do site, para as URLs canônicas.
 *
 * Ficou para trás na troca de domínio porque o script de migração só olhava o
 * index.html da landing — e este arquivo é JavaScript, não HTML. O sintoma foi
 * silencioso do jeito pior: todas as páginas anunciavam ao Google que a versão
 * oficial delas morava num endereço que ia sair do ar.
 */
const SITE = "https://mimu.pro";

/**
 * As rotas e o que cada uma diz de si.
 *
 * Título e descrição por rota não são enfeite: hoje as quatro compartilham o
 * mesmo `<title>` da home, e no resultado de busca isso aparece como quatro
 * páginas iguais. O Google trata título repetido como sinal de conteúdo
 * duplicado.
 */
const ROTAS = [
  {
    url: "/",
    arquivo: "index.html",
    // A home mantém o título e a descrição que já estavam no template.
    titulo: null,
    descricao: null,
  },
  {
    url: "/historias",
    arquivo: "historias.html",
    titulo: "Histórias de quem usa a Mimu",
    descricao:
      "Salão, mercadinho, manicure e barbearia: como negócios de bairro organizam agenda, dinheiro e clientes com a Mimu.",
  },
  ...STORIES.map((h) => ({
    url: `/historias/${h.slug}`,
    arquivo: `historias/${h.slug}.html`,
    titulo: `${h.heading} · ${h.company}`,
    descricao: primeiroParagrafo(h) ?? h.heading,
  })),
  ...Object.entries(LEGAL).map(([slug, doc]) => ({
    url: `/legal/${slug}`,
    arquivo: `legal/${slug}.html`,
    titulo: `${doc.title} · Mimu`,
    descricao: `${doc.title} da Mimu. Atualizada em ${doc.updated}.`,
  })),
];

/** Primeiro parágrafo da história, para virar a descrição da busca. */
function primeiroParagrafo(historia) {
  const bloco = (historia.blocks ?? []).find((b) => b.t === "p");
  if (!bloco) return null;
  return bloco.text.length > 155 ? `${bloco.text.slice(0, 152)}…` : bloco.text;
}

/** Troca o conteúdo de uma tag simples, mantendo o resto do template. */
function trocarTitulo(html, titulo) {
  return html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapar(titulo)}</title>`);
}

function trocarMeta(html, atributo, nome, valor) {
  const padrao = new RegExp(
    `(<meta\\s+${atributo}="${nome}"[\\s\\S]*?content=")[\\s\\S]*?(")`,
    "g",
  );
  return html.replace(padrao, `$1${escapar(valor)}$2`);
}

function escapar(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const template = await readFile(path.join(DIST, "index.html"), "utf8");

if (!template.includes('<div id="root"></div>')) {
  console.error(
    'prerender: não achei `<div id="root"></div>` no dist/index.html. O ' +
      "template mudou e a injeção sairia no lugar errado.",
  );
  process.exit(1);
}

// Pastas geradas por este script. Apagadas antes para uma história removida
// não continuar publicada com o HTML da última vez que existiu.
for (const pasta of ["historias", "legal"]) {
  await rm(path.join(DIST, pasta), { recursive: true, force: true });
}

let menorConteudo = Infinity;
const resumo = [];

for (const rota of ROTAS) {
  const corpo = await render(rota.url);

  // Uma rota que rendeu quase nada é sinal de que quebrou em silêncio (rota
  // errada, componente que pediu `window`). Melhor derrubar o build do que
  // publicar página vazia achando que está resolvido.
  const texto = corpo.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (texto.length < 200) {
    console.error(
      `prerender: a rota ${rota.url} rendeu só ${texto.length} caracteres de ` +
        "texto. Isso é uma página vazia — build interrompido.",
    );
    process.exit(1);
  }

  let html = template.replace(
    '<div id="root"></div>',
    `<div id="root">${corpo}</div>`,
  );

  if (rota.titulo) html = trocarTitulo(html, rota.titulo);
  if (rota.descricao) {
    html = trocarMeta(html, "name", "description", rota.descricao);
    html = trocarMeta(html, "property", "og:description", rota.descricao);
  }
  if (rota.titulo) html = trocarMeta(html, "property", "og:title", rota.titulo);

  // Canonical por rota: sem isto as quatro se declaram como sendo a home, e o
  // Google descarta as outras como cópia dela.
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${SITE}${rota.url}$2`,
  );

  const destino = path.join(DIST, rota.arquivo);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, html);

  menorConteudo = Math.min(menorConteudo, texto.length);
  resumo.push({ rota: rota.url, texto: texto.length, arquivo: rota.arquivo });
}

console.log(`prerender: ${resumo.length} páginas geradas com texto no HTML.`);
for (const r of resumo) {
  console.log(`  ${r.rota.padEnd(34)} ${String(r.texto).padStart(6)} caracteres → ${r.arquivo}`);
}
