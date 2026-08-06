const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "public", "splash");

const CORAL = "#FF6B5B";

// Mesmo traço do "M" de app/icon.svg (viewBox 512x512), reaproveitado aqui
// pra manter a marca idêntica em todo o app.
const M_PATH =
  "M106 249.5 L106 143.5 Q106 106 143.75 106 Q181.5 106 193.75 143.5 L256 249.5 L318.25 143.5 Q330.5 106 368.25 106 Q406 106 406 143.5 L406 249.5";
const M_PATH_BBOX = { width: 300, height: 143.5, centerX: 256, centerY: 177.75 };

const splashes = [
  { w: 2048, h: 2732, name: "splash-2048x2732.png" },
  { w: 1668, h: 2388, name: "splash-1668x2388.png" },
  { w: 1536, h: 2048, name: "splash-1536x2048.png" },
  { w: 1125, h: 2436, name: "splash-1125x2436.png" },
  { w: 1242, h: 2208, name: "splash-1242x2208.png" },
  { w: 750, h: 1334, name: "splash-750x1334.png" },
  { w: 640, h: 1136, name: "splash-640x1136.png" },
];

function buildSvg(w, h) {
  const markWidth = w * 0.22;
  const scale = markWidth / M_PATH_BBOX.width;
  const markCenterY = h * 0.43;
  const tx = w / 2 - M_PATH_BBOX.centerX * scale;
  const ty = markCenterY - M_PATH_BBOX.centerY * scale;

  const fontFamily = "'Helvetica Neue', Arial, sans-serif";
  const wordmarkSize = Math.round(w * 0.09);
  const wordmarkY = h * 0.545;
  const taglineSize = Math.round(w * 0.032);
  const taglineLine1Y = h * 0.615;
  const taglineLine2Y = taglineLine1Y + taglineSize * 1.6;

  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${w}" height="${h}" fill="${CORAL}" />
  <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">
    <path d="${M_PATH}" stroke="#FFFFFF" stroke-width="31.25" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  </g>
  <text x="${w / 2}" y="${wordmarkY.toFixed(1)}" text-anchor="middle" font-family="${fontFamily}" font-weight="600" font-size="${wordmarkSize}" letter-spacing="-1" fill="#FFFFFF">mimu</text>
  <text x="${w / 2}" y="${taglineLine1Y.toFixed(1)}" text-anchor="middle" font-family="${fontFamily}" font-weight="400" font-size="${taglineSize}" fill="#FFFFFF" fill-opacity="0.85">Enquanto você trabalha,</text>
  <text x="${w / 2}" y="${taglineLine2Y.toFixed(1)}" text-anchor="middle" font-family="${fontFamily}" font-weight="400" font-size="${taglineSize}" fill="#FFFFFF" fill-opacity="0.85">a Mimu cuida do seu negócio.</text>
</svg>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const { w, h, name } of splashes) {
    const svg = buildSvg(w, h);
    await sharp(Buffer.from(svg)).png().toFile(path.join(OUT_DIR, name));
    console.log(`gerado: ${name} (${w}x${h})`);
  }

  console.log(`\n${splashes.length} splash screens geradas em public/splash/`);
}

main().catch((err) => {
  console.error("Erro ao gerar splash screens:", err);
  process.exit(1);
});
