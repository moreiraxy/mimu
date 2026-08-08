/**
 * Converte o clone estatico (../pierre-clone/index.html) em componentes Next.js.
 *
 * Principios:
 *  - o markup e o CSS do Webflow sao preservados EXATAMENTE (objetivo 1:1);
 *  - blocos <style> continuam inline, no mesmo ponto da arvore, porque a ordem
 *    da cascata depende da posicao deles no documento;
 *  - cada <script> inline e extraido para tools/inline-scripts/ e vira um
 *    componente client em components/behaviors/ num passo seguinte;
 *  - <script src> sai do markup e e declarado no layout via next/script.
 *
 * O mapa de atributos abaixo NAO e generico: foi derivado do inventario real
 * deste documento (apenas class, for, fill-rule e clip-rule precisam mudar).
 */

import fs from 'node:fs';
import path from 'node:path';
import * as parse5 from 'parse5';

const SRC = '../pierre-clone/index.html';
const ROOT = process.cwd();

// ---------------------------------------------------------------- utilidades

const html = fs.readFileSync(SRC, 'utf8');
const doc = parse5.parse(html);

const findTag = (node, tag) => {
  if (node.tagName === tag) return node;
  for (const child of node.childNodes || []) {
    const hit = findTag(child, tag);
    if (hit) return hit;
  }
  return null;
};

const body = findTag(doc, 'body');
const attrOf = (node, name) =>
  (node.attrs || []).find((a) => a.name === name)?.value;
const isElement = (node) => Boolean(node.tagName);
const textOf = (node) => node.childNodes?.[0]?.value ?? '';

const VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

// Renomeacoes exigidas pelo React. Todo o resto (data-*, aria-*, role, src,
// alt, href, loading, effect, id, type, xmlns, fill, d, width, height,
// viewBox) e valido em JSX e passa direto.
const ATTR_MAP = {
  class: 'className',
  for: 'htmlFor',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
};

const warnings = [];

// ------------------------------------------------------ serializacao em JSX

const escapeText = (text) =>
  // Chaves colidem com a sintaxe do JSX; entidades ja vieram decodificadas
  // pelo parser, entao o texto pode ser emitido cru fora desses casos.
  /[{}<>]/.test(text) ? `{${JSON.stringify(text)}}` : text;

const serializeAttrs = (node) => {
  const out = [];
  for (const { name, value } of node.attrs || []) {
    if (name === 'style') {
      // Neste documento o atributo style e sempre vazio ou o marcador de
      // variante "max-width-small" (nao e CSS). Nada no CSS nem no JS o
      // referencia, entao descartar preserva o comportamento; React ainda
      // exigiria um objeto aqui.
      if (value !== '' && value !== 'max-width-small') {
        warnings.push(`style com CSS real descartado: ${value}`);
      }
      continue;
    }
    const jsxName = ATTR_MAP[name] ?? name;
    if (value === '') out.push(`${jsxName}=""`);
    else if (value.includes('"')) out.push(`${jsxName}={${JSON.stringify(value)}}`);
    else out.push(`${jsxName}="${value}"`);
  }
  return out;
};

const inlineScripts = [];
const vendorScripts = [];

const serialize = (node, depth) => {
  const pad = '  '.repeat(depth);

  if (node.nodeName === '#text') {
    // Whitespace importa. O JSX descarta espacos em branco que contenham
    // newline, entao emitir texto cru numa linha indentada PERDE os espacos
    // entre elementos inline. Por isso todo texto sai como string JS, com
    // runs de whitespace colapsados a um espaco (que e exatamente o que o
    // HTML renderiza).
    const collapsed = node.value.replace(/\s+/g, ' ');
    if (!collapsed.trim()) {
      // No inline-only entre irmaos: preserva o espaco unico que o HTML
      // renderizaria naquele ponto.
      return `${pad}{' '}\n`;
    }
    return `${pad}{${JSON.stringify(collapsed)}}\n`;
  }
  if (node.nodeName === '#comment') return '';
  if (!isElement(node)) return '';

  if (node.tagName === 'script') {
    const src = attrOf(node, 'src');
    if (src) {
      vendorScripts.push(src);
      return `${pad}{/* ${src} -> carregado em app/layout.tsx */}\n`;
    }
    const index = inlineScripts.length;
    inlineScripts.push(textOf(node));
    return `${pad}{/* script inline #${index} -> components/behaviors/ */}\n`;
  }

  if (node.tagName === 'style') {
    // Mantido inline para nao alterar a ordem da cascata.
    return (
      `${pad}<style\n` +
      `${pad}  dangerouslySetInnerHTML={{\n` +
      `${pad}    __html: ${JSON.stringify(textOf(node))},\n` +
      `${pad}  }}\n` +
      `${pad}/>\n`
    );
  }

  const attrs = serializeAttrs(node);
  const children = (node.childNodes || [])
    .map((child) => serialize(child, depth + 1))
    .join('');
  const openAttrs = attrs.length ? ' ' + attrs.join(' ') : '';

  if (VOID.has(node.tagName) || !children) {
    return `${pad}<${node.tagName}${openAttrs} />\n`;
  }
  return `${pad}<${node.tagName}${openAttrs}>\n${children}${pad}</${node.tagName}>\n`;
};

// ------------------------------------------------------- divisao em arquivos

const pageWrap = (body.childNodes || []).find(
  (n) => isElement(n) && attrOf(n, 'class') === 'page_wrap',
);
if (!pageWrap) throw new Error('div.page_wrap nao encontrada');

const wrapChildren = (pageWrap.childNodes || []).filter(isElement);
const main = wrapChildren.find((n) => n.tagName === 'main');
const footer = wrapChildren.find((n) => n.tagName === 'footer');
const nav = wrapChildren.find((n) =>
  (attrOf(n, 'class') || '').includes('nav_component'));
if (!main || !footer || !nav) throw new Error('main/footer/nav nao encontrados');

const sections = (main.childNodes || []).filter((n) => n.tagName === 'section');
if (sections.length !== 10) {
  throw new Error(`esperava 10 <section>, encontrei ${sections.length}`);
}

const write = (relPath, contents) => {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, contents);
  return relPath;
};

const componentFile = (name, jsx, note) =>
  `/* Gerado por tools/convert.mjs a partir de ../pierre-clone/index.html.\n` +
  `   ${note}\n` +
  `   Markup preservado 1:1 — nao editar a mao; ajuste o conversor. */\n\n` +
  `export default function ${name}() {\n` +
  `  return (\n` +
  `    <>\n` +
  jsx +
  `    </>\n` +
  `  );\n` +
  `}\n`;

const written = [];

written.push(
  write('components/nav.tsx',
    componentFile('Nav', serialize(nav, 3),
      'Barra de navegacao (desktop + mobile).')),
);

sections.forEach((section, i) => {
  const num = String(i + 1).padStart(2, '0');
  const id = attrOf(section, 'id');
  written.push(
    write(`components/sections/section-${num}.tsx`,
      componentFile(`Section${num}`, serialize(section, 3),
        `Secao ${i + 1} de 10${id ? ` (#${id})` : ''}.`)),
  );
});

written.push(
  write('components/footer.tsx',
    componentFile('Footer', serialize(footer, 3),
      'Rodape, inclui o QR code de download.')),
);

// Tudo dentro de .page_wrap fora de nav/main/footer: overlays de guia/grid do
// Webflow, o <style> das variaveis do nav e os guards de landscape.
const chromeBefore = [];
const chromeAfter = [];
let seenMain = false;
for (const child of wrapChildren) {
  if (child === main) { seenMain = true; continue; }
  if (child === nav || child === footer) continue;
  (seenMain ? chromeAfter : chromeBefore).push(child);
}

written.push(
  write('components/chrome.tsx',
    componentFile('Chrome', chromeBefore.map((n) => serialize(n, 3)).join(''),
      'Overlays de guia/grid do Webflow e <style> de variaveis do nav.')),
);
if (chromeAfter.length) {
  written.push(
    write('components/chrome-after.tsx',
      componentFile('ChromeAfter', chromeAfter.map((n) => serialize(n, 3)).join(''),
        'Elementos entre <main> e o fim de .page_wrap.')),
  );
}

// Os scripts finais sao filhos diretos de <body>, fora de .page_wrap.
// Percorre-los aqui os registra em inlineScripts/vendorScripts (a saida JSX
// e descartada: vendor vai para o layout, inline vira componente client).
const trailing = (body.childNodes || []).filter(
  (n) => isElement(n) && n !== pageWrap,
);
for (const node of trailing) serialize(node, 0);

if (inlineScripts.length !== 10 || vendorScripts.length !== 6) {
  throw new Error(
    `esperava 10 scripts inline e 6 vendor no body; ` +
    `encontrei ${inlineScripts.length} e ${vendorScripts.length}`,
  );
}

// -------------------------------------------------------------- relatorio

fs.mkdirSync(path.join(ROOT, 'tools/inline-scripts'), { recursive: true });
inlineScripts.forEach((code, i) => {
  fs.writeFileSync(
    path.join(ROOT, `tools/inline-scripts/${String(i).padStart(2, '0')}.js`),
    code,
  );
});

fs.writeFileSync(
  path.join(ROOT, 'tools/convert-report.json'),
  JSON.stringify(
    {
      bodyClass: attrOf(body, 'class'),
      mainAttrs: serializeAttrs(main).join(' '),
      pageWrapClass: attrOf(pageWrap, 'class'),
      sectionIds: sections.map((s) => attrOf(s, 'id') ?? null),
      chromeBefore: chromeBefore.length,
      chromeAfter: chromeAfter.length,
      vendorScripts,
      inlineScriptSizes: inlineScripts.map((s) => s.length),
      warnings,
      written,
    },
    null,
    2,
  ),
);

console.log(`componentes escritos: ${written.length}`);
written.forEach((w) => console.log('  ' + w));
console.log(`\nscripts inline extraidos: ${inlineScripts.length} -> tools/inline-scripts/`);
console.log(`vendor scripts: ${vendorScripts.length}`);
vendorScripts.forEach((s) => console.log('  ' + s));
console.log(`\navisos: ${warnings.length}`);
warnings.forEach((w) => console.log('  !! ' + w));
