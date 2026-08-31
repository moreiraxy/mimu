/**
 * Gera o ícone de 1024×1024 que a App Store exige.
 *
 * Duas coisas impedem reaproveitar o public/icons/icon-512.png: ele tem canal
 * alfa e cantos arredondados, e o App Store Connect recusa os dois. A Apple
 * aplica a própria máscara de canto — mandar o ícone já arredondado faz o
 * corte acontecer duas vezes e come as pontas do "M".
 *
 * A fonte do desenho é o MARK_PATH de components/Logo.tsx, e não o
 * app/icon.svg. O SVG ficou para trás: o commit 74f9350 corrigiu a marca nos
 * PNGs e não voltou nele, e o "M" de lá tem outra proporção (1.90 contra os
 * 1.33 da marca atual). Gerar da mesma constante que as telas desenham é o
 * que impede a loja e o app mostrarem marcas diferentes de novo.
 *
 *   node scripts/gerar-icone-appstore.mjs
 */
import sharp from "sharp";
import { readFile, mkdir } from "node:fs/promises";

const FUNDO = "#CCFF00";
const TRACO = "#0A0A0A";
const LADO = 1024;

// O viewBox e a espessura com que Logo.tsx desenha a marca. Se mudarem lá,
// mudam aqui — por isso o path é lido do arquivo em vez de copiado.
const VB_W = 48;
const VB_H = 36;
const ESPESSURA = 5;

/**
 * Quanto da largura do ícone o desenho ocupa.
 *
 * 57.2% não é gosto: é a medida tirada do public/icons/icon-512.png que já
 * está no ar. O ícone da loja precisa ser o mesmo que a pessoa vê na tela de
 * início depois de instalar; respirar diferente faz parecer outro app.
 */
const OCUPACAO = 0.572;

const logo = await readFile("components/Logo.tsx", "utf8");
const path = logo.match(/export const MARK_PATH =\s*\n?\s*"([^"]+)"/)?.[1];
if (!path) {
  console.error("Não achei o MARK_PATH em components/Logo.tsx.");
  process.exit(1);
}

/**
 * Onde a tinta realmente cai, medida em vez de deduzida.
 *
 * Deduzir não funcionou: a primeira versão assumiu que a caixa de tinta era o
 * viewBox mais a espessura do traço, e o desenho saiu 4 pontos menor do que o
 * ícone que já está no ar. O path começa em x=2 e y=2, não na borda, e os
 * cantos arredondados das curvas não alcançam o extremo do viewBox.
 *
 * Renderizar uma vez e medir custa alguns milissegundos e acerta sempre,
 * inclusive se um dia mexerem no MARK_PATH.
 */
async function medirTinta(origem, criterio = "alfa") {
  const { data, info } = await sharp(origem)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = Infinity, maxX = -1, minY = Infinity, maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      /*
       * Dois critérios porque as duas medições são de coisas diferentes.
       *
       * No calibrador o fundo é transparente, então tinta é tudo que foi
       * desenhado: basta o alfa. No arquivo final o fundo é o amarelo opaco,
       * e medir por alfa acusaria a tela inteira — ali tinta é o que está
       * escuro. Foi exatamente esse o erro que fez a conferência dizer 99.9%.
       */
      const eTinta =
        criterio === "alfa"
          ? data[i + 3] > 128
          : data[i] < 100 && data[i + 1] < 100 && data[i + 2] < 100;
      if (eTinta) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
}

const desenho = (extra = "") =>
  `<path d="${path}" stroke="${TRACO}" stroke-width="${ESPESSURA}" stroke-linecap="round" stroke-linejoin="round" fill="none" ${extra} />`;

// Passo 1: desenhar sem fundo, no viewBox nativo ampliado, só para medir.
const CALIBRE = 1024;
const svgCalibre = `<svg width="${CALIBRE}" height="${(CALIBRE * VB_H) / VB_W}" viewBox="0 0 ${VB_W} ${VB_H}" xmlns="http://www.w3.org/2000/svg">${desenho()}</svg>`;
const tinta = await medirTinta(Buffer.from(svgCalibre), "alfa");

// De volta para unidades do viewBox, agora com a caixa de tinta verdadeira.
const porUnidade = CALIBRE / VB_W;
const tintaW = tinta.w / porUnidade;
const tintaH = tinta.h / porUnidade;
const tintaX = tinta.minX / porUnidade;
const tintaY = tinta.minY / porUnidade;

// Passo 2: escalar e deslocar para que essa caixa fique centrada e ocupe
// exatamente a mesma fração que o ícone que já está no ar.
const escala = (LADO * OCUPACAO) / tintaW;
const deslocX = (LADO - tintaW * escala) / 2 - tintaX * escala;
const deslocY = (LADO - tintaH * escala) / 2 - tintaY * escala;

const svg = `<svg width="${LADO}" height="${LADO}" viewBox="0 0 ${LADO} ${LADO}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${LADO}" height="${LADO}" fill="${FUNDO}" />
  <g transform="translate(${deslocX.toFixed(3)} ${deslocY.toFixed(3)}) scale(${escala.toFixed(6)})">
    ${desenho()}
  </g>
</svg>`;

await mkdir("public/icons", { recursive: true });
const destino = "public/icons/appstore-1024.png";

await sharp(Buffer.from(svg))
  .png()
  // flatten remove o alfa de verdade, pintando o transparente com o fundo.
  // Só ajustar a qualidade do PNG não bastaria: o canal continuaria existindo,
  // e é a existência dele que o App Store Connect recusa.
  .flatten({ background: FUNDO })
  .toFile(destino);

/*
 * Conferência automática, porque "parece certo" já falhou uma vez aqui: o
 * primeiro ícone saiu com o desenho na metade de cima e passaria batido se
 * ninguém olhasse. Estas três medidas são o que a loja recusa ou o que faz o
 * ícone parecer de outro app.
 */
const meta = await sharp(destino).metadata();
// Mede o ARQUIVO gravado, não o SVG: é o arquivo que vai para a loja.
const final = await medirTinta(destino, "escuro");

const larguraTinta = final.w / LADO;
const centroX = (final.minX + final.maxX) / 2 / LADO;
const centroY = (final.minY + final.maxY) / 2 / LADO;
const pct = (v) => (v * 100).toFixed(1) + "%";

console.log(`${destino} — ${meta.width}×${meta.height}, alfa: ${meta.hasAlpha}`);
console.log(`  tinta: ${pct(larguraTinta)} de largura`);
console.log(`  centro: x ${pct(centroX)}, y ${pct(centroY)}`);

const problemas = [];
if (meta.hasAlpha) problemas.push("tem canal alfa — o App Store Connect recusa");
if (meta.width !== LADO || meta.height !== LADO) problemas.push(`não é ${LADO}×${LADO}`);
if (Math.abs(larguraTinta - OCUPACAO) > 0.02) problemas.push("desenho fora da proporção do ícone que já está no ar");
if (Math.abs(centroX - 0.5) > 0.01 || Math.abs(centroY - 0.5) > 0.01) problemas.push("desenho descentralizado");

if (problemas.length > 0) {
  console.error("\nÍcone fora da especificação:");
  for (const p of problemas) console.error(`  - ${p}`);
  process.exit(1);
}
console.log("  OK — dentro da especificação da App Store.");
