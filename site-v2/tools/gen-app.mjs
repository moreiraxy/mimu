/**
 * Gera app/layout.tsx, app/page.tsx e components/behaviors/*.tsx.
 *
 * Roda DEPOIS de tools/convert.mjs (que produz tools/inline-scripts/ e
 * tools/convert-report.json).
 *
 * Decisoes que valem registro:
 *  - Os metadados vem do <head> do clone, lidos programaticamente, para nao
 *    dependerem de transcricao manual.
 *  - Os vendor scripts usam strategy="beforeInteractive": executam antes da
 *    hidratacao, na ordem original, garantindo que jQuery/Webflow/GSAP/Lenis/
 *    QRCodeStyling existam quando os useEffect dos comportamentos rodarem.
 *  - Tres scripts estavam embrulhados em DOMContentLoaded. Esse evento ja
 *    disparou quando o React hidrata, entao o embrulho e removido e o corpo
 *    passa a rodar direto no useEffect. Essa e a unica adaptacao de logica.
 */

import fs from 'node:fs';
import path from 'node:path';
import * as parse5 from 'parse5';

const ROOT = process.cwd();
const CLONE = '../pierre-clone/index.html';

const report = JSON.parse(fs.readFileSync('tools/convert-report.json', 'utf8'));

// ------------------------------------------------------- metadados do <head>

const doc = parse5.parse(fs.readFileSync(CLONE, 'utf8'));
const findTag = (n, t) => {
  if (n.tagName === t) return n;
  for (const c of n.childNodes || []) {
    const hit = findTag(c, t);
    if (hit) return hit;
  }
  return null;
};
const head = findTag(doc, 'head');
const htmlEl = findTag(doc, 'html');
const attrOf = (n, k) => (n.attrs || []).find((a) => a.name === k)?.value;

const metaByName = {};
const metaByProp = {};
const links = [];
for (const node of head.childNodes || []) {
  if (node.tagName === 'meta') {
    const name = attrOf(node, 'name');
    const prop = attrOf(node, 'property');
    const content = attrOf(node, 'content');
    if (name) metaByName[name] = content;
    if (prop) metaByProp[prop] = content;
  }
  if (node.tagName === 'link') {
    links.push({
      rel: attrOf(node, 'rel'),
      href: attrOf(node, 'href'),
      hrefLang: attrOf(node, 'hrefLang') ?? attrOf(node, 'hreflang'),
    });
  }
}
const title = findTag(head, 'title')?.childNodes?.[0]?.value ?? '';
const lang = attrOf(htmlEl, 'lang') ?? 'pt-BR';

// caminhos locais do clone -> caminhos absolutos do /public
const pub = (href) => (href?.startsWith('assets/') ? '/' + href : href);
const icon = pub(links.find((l) => l.rel === 'shortcut icon')?.href);
const appleIcon = pub(links.find((l) => l.rel === 'apple-touch-icon')?.href);
const alternates = links.filter((l) => l.rel === 'alternate' && l.hrefLang);

const q = (s) => JSON.stringify(s ?? '');

// -------------------------------------------------------------- behaviors

const BEHAVIORS = [
  ['00', 'NavBanner', 'nav-banner', 'Fecha o banner do nav e trata o link de skip.'],
  ['01', 'ParallaxFloat', 'parallax-float', 'Parallax de scroll + flutuacao continua.'],
  ['02', 'Tabs', 'tabs', 'Componente de tabs (.tab_wrap_simple).'],
  ['03', 'Accordion', 'accordion', 'Componente de accordion (.accordion_wrap).'],
  ['04', 'Marquee', 'marquee', 'Marquee infinito ([data-marquee-viewport]).'],
  ['05', 'DynamicYear', 'dynamic-year', 'Preenche [data-dynamic-year] com o ano atual.'],
  ['06', 'Effects', 'effects', 'Detector de elementos [effect].'],
  ['07', 'QrCode', 'qr-code', 'Renderiza o QR code de download no rodape.'],
  ['08', 'LenisInit', 'lenis-init', 'Inicializa o scroll suave do Lenis.'],
  ['09', 'AnimateOnView', 'animate-on-view', 'Reinicia SVGs animados ao entrarem em tela.'],
];

// scripts inteiramente embrulhados em DOMContentLoaded
const DCL_WRAPPER =
  /^document\.addEventListener\(\s*["']DOMContentLoaded["']\s*,\s*function\s*\(\)\s*\{([\s\S]*)\}\s*\)\s*;?$/;

const NEEDS_UNWRAP = new Set(['02', '03', '05']);

const written = [];
const notes = [];

for (const [id, name, file, note] of BEHAVIORS) {
  let code = fs.readFileSync(`tools/inline-scripts/${id}.js`, 'utf8').trim();

  let adapted = false;
  if (NEEDS_UNWRAP.has(id)) {
    const match = code.match(DCL_WRAPPER);
    if (!match) {
      throw new Error(
        `${id}.js: esperava um embrulho DOMContentLoaded e nao encontrei. ` +
        `Reveja NEEDS_UNWRAP antes de gerar.`,
      );
    }
    code = match[1].trim();
    adapted = true;
    notes.push(`${file}: embrulho DOMContentLoaded removido`);
  } else if (DCL_WRAPPER.test(code)) {
    throw new Error(
      `${id}.js casa com o embrulho DOMContentLoaded mas nao esta em NEEDS_UNWRAP`,
    );
  }

  const indented = code.replace(/^/gm, '    ').replace(/^\s+$/gm, '');

  const header =
    `/* Gerado por tools/gen-app.mjs a partir do <script> inline #${id}\n` +
    `   do clone estatico. ${note}\n` +
    (adapted
      ? `   ADAPTADO: o codigo original estava dentro de\n` +
        `   document.addEventListener("DOMContentLoaded", ...). Esse evento ja\n` +
        `   disparou quando o React hidrata, entao o embrulho foi removido e o\n` +
        `   corpo roda direto no useEffect. Logica interna intacta.\n`
      : `   Codigo preservado 1:1; apenas movido para dentro de um useEffect.\n`) +
    `   Nao editar a mao: ajuste tools/gen-app.mjs e regenere. */\n\n` +
    `// @ts-nocheck -- codigo do site original, preservado sem tipagem\n` +
    `'use client';\n\n` +
    `import { useEffect } from 'react';\n\n` +
    `export default function ${name}() {\n` +
    `  useEffect(() => {\n`;

  const footer = `  }, []);\n\n  return null;\n}\n`;

  const rel = `components/behaviors/${file}.tsx`;
  fs.mkdirSync(path.join(ROOT, 'components/behaviors'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, rel), header + indented + '\n' + footer);
  written.push(rel);
}

// ---------------------------------------------------------------- layout

const vendorTags = report.vendorScripts
  .map(
    (src, i) =>
      `        <Script\n` +
      `          id="vendor-${i}"\n` +
      `          src="/${src}"\n` +
      `          strategy="beforeInteractive"\n` +
      `        />`,
  )
  .join('\n');

const layout =
  `/* Gerado por tools/gen-app.mjs — metadados lidos do <head> do clone. */\n\n` +
  `import type { Metadata } from 'next';\n` +
  `import Script from 'next/script';\n` +
  `import './webflow.css';\n\n` +
  `export const metadata: Metadata = {\n` +
  `  title: ${q(title)},\n` +
  `  description: ${q(metaByName.description)},\n` +
  `  openGraph: {\n` +
  `    title: ${q(metaByProp['og:title'])},\n` +
  `    description: ${q(metaByProp['og:description'])},\n` +
  `    type: 'website',\n` +
  `    images: [${q(pub(metaByProp['og:image']))}],\n` +
  `  },\n` +
  `  twitter: {\n` +
  `    card: 'summary_large_image',\n` +
  `    title: ${q(metaByName['twitter:title'])},\n` +
  `    description: ${q(metaByName['twitter:description'])},\n` +
  `    images: [${q(pub(metaByName['twitter:image']))}],\n` +
  `  },\n` +
  `  icons: {\n` +
  `    icon: ${q(icon)},\n` +
  `    apple: ${q(appleIcon)},\n` +
  `  },\n` +
  `  alternates: {\n` +
  `    languages: {\n` +
  alternates.map((a) => `      ${q(a.hrefLang)}: ${q(a.href)},`).join('\n') +
  `\n    },\n` +
  `  },\n` +
  `  other: { generator: 'Webflow' },\n` +
  `};\n\n` +
  `export default function RootLayout({\n` +
  `  children,\n` +
  `}: Readonly<{ children: React.ReactNode }>) {\n` +
  `  return (\n` +
  `    <html lang=${q(lang)}>\n` +
  `      <body className=${q(report.bodyClass)}>\n` +
  `        {/* Reproduz o detector de JS/touch do Webflow, que no original\n` +
  `            roda no <head> e adiciona as classes w-mod-* em <html>. */}\n` +
  `        <Script id="wf-mod" strategy="beforeInteractive">\n` +
  '          {`!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);`}\n' +
  `        </Script>\n` +
  `        {/* Aplica a classe de banner escondido antes da pintura, como no\n` +
  `            original (o listener de clique fica em components/behaviors). */}\n` +
  `        <Script id="hide-nav-banner" strategy="beforeInteractive">\n` +
  '          {`if(sessionStorage.getItem("hide-nav-banner")==="true"){document.documentElement.classList.add("hide-nav-banner");}`}\n' +
  `        </Script>\n` +
  vendorTags +
  `\n        <Script\n` +
  `          id="qr-code-styling"\n` +
  `          src="/assets/js/qr-code-styling.js"\n` +
  `          strategy="beforeInteractive"\n` +
  `        />\n` +
  `        {children}\n` +
  `      </body>\n` +
  `    </html>\n` +
  `  );\n` +
  `}\n`;

fs.writeFileSync(path.join(ROOT, 'app/layout.tsx'), layout);
written.push('app/layout.tsx');

// ------------------------------------------------------------------ page

const sectionImports = report.sectionIds
  .map((_, i) => {
    const num = String(i + 1).padStart(2, '0');
    return `import Section${num} from '@/components/sections/section-${num}';`;
  })
  .join('\n');

const sectionTags = report.sectionIds
  .map((_, i) => `          <Section${String(i + 1).padStart(2, '0')} />`)
  .join('\n');

const behaviorImports = BEHAVIORS.map(
  ([, name, file]) => `import ${name} from '@/components/behaviors/${file}';`,
).join('\n');

const behaviorTags = BEHAVIORS.map(([, name]) => `      <${name} />`).join('\n');

const page =
  `/* Gerado por tools/gen-app.mjs — compoe o clone a partir dos componentes\n` +
  `   de secao. Os comportamentos ficam no fim, na ordem do documento\n` +
  `   original: o useEffect de cada um roda nessa mesma ordem. */\n\n` +
  `import Chrome from '@/components/chrome';\n` +
  `import Nav from '@/components/nav';\n` +
  sectionImports +
  `\nimport Footer from '@/components/footer';\n` +
  behaviorImports +
  `\n\nexport default function Home() {\n` +
  `  return (\n` +
  `    <>\n` +
  `      <div className=${q(report.pageWrapClass)}>\n` +
  `        <Chrome />\n` +
  `        <Nav />\n` +
  `        <main ${report.mainAttrs}>\n` +
  sectionTags +
  `\n        </main>\n` +
  `        <Footer />\n` +
  `      </div>\n` +
  behaviorTags +
  `\n    </>\n` +
  `  );\n` +
  `}\n`;

fs.writeFileSync(path.join(ROOT, 'app/page.tsx'), page);
written.push('app/page.tsx');

console.log('gerados:');
written.forEach((w) => console.log('  ' + w));
console.log('\nadaptacoes:');
notes.forEach((n) => console.log('  ' + n));
console.log(`\ntitle: ${title}`);
console.log(`lang: ${lang}  |  body class: ${report.bodyClass}`);
console.log(`main: ${report.mainAttrs}`);
