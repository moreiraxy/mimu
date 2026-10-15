/**
 * Gera os PNGs de ícone do site e do app instalado, a partir de app/icon.svg.
 *
 * POR QUE ESTE SCRIPT EXISTE. Os arquivos em public/icons/ foram feitos à mão
 * em agosto de 2026 e não havia nada que dissesse COMO. Quando o ícone mudou de
 * cor (de néon para grafite, em 15/10/2026), o SVG virou um comando e os nove
 * PNGs continuariam verdes para sempre — favicon da aba, ícone da tela de
 * início, atalho do iOS. É o tipo de inconsistência que ninguém reporta: a
 * pessoa só acha o app meio malfeito.
 *
 * Rodar depois de QUALQUER mudança em app/icon.svg:
 *
 *     node scripts/gerar-icones-web.mjs
 *
 * O ÍCONE MASCARÁVEL é o único diferente: o Android corta num círculo, e sem
 * folga ele come as pontas do "M". A arte entra a 80% do lado, centralizada
 * sobre o mesmo grafite do fundo — e não sobre transparente, senão o círculo
 * recortado mostra o papel de parede do sistema atravessando o ícone.
 *
 * O ícone NATIVO do app da App Store não sai daqui: ele vive em
 * ios/App/App/Assets.xcassets e tem script próprio (gerar-icone-appstore.mjs),
 * porque trocar aquele exige build novo e passa por revisão da Apple.
 */

import sharp from "sharp";
import { readFileSync } from "node:fs";

const ORIGEM = "app/icon.svg";
const svg = readFileSync(ORIGEM);

/** O mesmo #1A1A1A do `rect` do SVG. */
const FUNDO = { r: 26, g: 26, b: 26, alpha: 1 };

/*
 * `density` alto na leitura do SVG.
 *
 * O sharp rasteriza vetor na densidade que receber, não no tamanho final: no
 * padrão (72dpi) o 512 sai de um raster de 512px redimensionado, e as curvas do
 * "M" ficam serrilhadas. 384dpi dá folga para todos os tamanhos desta lista.
 */
const LEITURA = { density: 384 };

const TAMANHOS = [
  ["public/icons/favicon-16.png", 16],
  ["public/icons/favicon-32.png", 32],
  ["public/icons/favicon-48.png", 48],
  ["public/icons/favicon-64.png", 64],
  // 180 é o apple-touch-icon: o iOS ignora SVG, então este é o ícone do
  // atalho na tela de início do iPhone (ver app/layout.tsx).
  ["public/icons/icon-180.png", 180],
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
];

for (const [destino, lado] of TAMANHOS) {
  await sharp(svg, LEITURA).resize(lado, lado).png().toFile(destino);
  console.log(`${destino} (${lado}px)`);
}

/*
 * O BADGE: só o "M", em branco, sobre transparente.
 *
 * O Android pinta o badge como MÁSCARA na barra de status: ele usa só o canal
 * alfa e descarta a cor. Com a placa cheia do ícone normal, o resultado é um
 * quadrado branco sólido — foi isso que apareceu como "logo antiga" na
 * notificação, porque nada do desenho sobrevivia à máscara.
 */
const SO_O_M = `<svg width="96" height="96" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <path
    d="M106 249.5 L106 143.5 Q106 106 143.75 106 Q181.5 106 193.75 143.5 L256 249.5 L318.25 143.5 Q330.5 106 368.25 106 Q406 106 406 143.5 L406 249.5"
    stroke="#FFFFFF" stroke-width="46" stroke-linecap="round"
    stroke-linejoin="round" fill="none"
  />
</svg>`;
await sharp(Buffer.from(SO_O_M), LEITURA)
  .resize(96, 96)
  .png()
  .toFile("public/icons/badge-96.png");
console.log("public/icons/badge-96.png (96px, só o traço, fundo transparente)");

const arte = await sharp(svg, LEITURA).resize(410, 410).png().toBuffer();
await sharp({
  create: { width: 512, height: 512, channels: 4, background: FUNDO },
})
  .composite([{ input: arte, gravity: "center" }])
  .png()
  .toFile("public/icons/icon-maskable-512.png");
console.log("public/icons/icon-maskable-512.png (512px, arte a 80%)");
