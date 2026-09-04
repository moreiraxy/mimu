/**
 * Os assets que o projeto Xcode usa: ícone do app e tela de abertura.
 *
 * Sem isto, o app carrega os do template do Capacitor — um quadrado branco
 * genérico. Era o caso até 04/09/2026.
 *
 * O ÍCONE vem de public/icons/appstore-1024.png, que por sua vez é gerado por
 * gerar-icone-appstore.mjs a partir do MARK_PATH de components/Logo.tsx. A
 * corrente inteira sai de uma constante só, de propósito: marca que se copia é
 * marca que diverge.
 *
 * A SPLASH LEVA A MARCA, e eu errei isso primeiro.
 *
 * A primeira versão era fundo liso, para a TelaAbertura poder desenhar o "M"
 * traço a traço sem ele piscar. O raciocínio ignorava um fato do código:
 * TelaAbertura é montada só em app/(dashboard)/layout.tsx, isto é, SÓ PARA
 * QUEM JÁ ESTÁ LOGADO. Quem abre o aplicativo sem sessão — o primeiro contato,
 * justamente — não via splash web nenhuma. O resultado no aparelho foram três
 * segundos de preto puro antes da primeira tela.
 *
 * Agora ela desenha o mesmo que a TelaAbertura mostra: o quadrado néon com o
 * "M", sobre o #0A0A0A que também é o ios.backgroundColor. Quem está logado vê
 * a marca da nativa dar lugar à mesma marca na web, no mesmo lugar; quem não
 * está vê a marca e depois a tela de começar. Ninguém vê preto vazio.
 *
 * O tamanho não é gosto: 260px no quadrado de 2732 cai perto dos 80pt do
 * LogoMark size="lg", que é o que a TelaAbertura desenha. Errar isso faz a
 * marca dar um pulo de tamanho na troca.
 *
 *   node scripts/gerar-assets-nativos.mjs
 */
import sharp from "sharp";
import { mkdir, copyFile, readFile } from "node:fs/promises";

const FUNDO = "#0A0A0A";
const NEON = "#CCFF00";
const LADO_SPLASH = 2732;
const ICONE = "public/icons/appstore-1024.png";

await mkdir("assets", { recursive: true });

// O ícone entra como está: já é 1024×1024 sem alfa, que é o que a Apple pede.
await copyFile(ICONE, "assets/icon.png");

// O MARK_PATH vem de components/Logo.tsx pelo mesmo motivo que em
// gerar-icone-appstore.mjs: a marca precisa ter um desenhista só.
const logo = await readFile("components/Logo.tsx", "utf8");
const MARK_PATH = logo.match(/export const MARK_PATH =\s*\n?\s*"([^"]+)"/)?.[1];
if (!MARK_PATH) {
  console.error("Não achei o MARK_PATH em components/Logo.tsx.");
  process.exit(1);
}

// As proporções do LogoMark size="lg": caixa de 80pt, canto de 20, e o "M"
// ocupando 48 de largura da caixa. Mantidas como frações para o quadrado de
// 2732 render o mesmo desenho, só que maior.
const CAIXA = 260;
const CANTO = CAIXA * (20 / 80);
const M_LARGURA = CAIXA * (48 / 80);
const M_ALTURA = M_LARGURA * (36 / 48);
const x = (LADO_SPLASH - CAIXA) / 2;
const y = (LADO_SPLASH - CAIXA) / 2;

const svg = `<svg width="${LADO_SPLASH}" height="${LADO_SPLASH}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${LADO_SPLASH}" height="${LADO_SPLASH}" fill="${FUNDO}" />
  <rect x="${x}" y="${y}" width="${CAIXA}" height="${CAIXA}" rx="${CANTO}" fill="${NEON}" />
  <g transform="translate(${x + (CAIXA - M_LARGURA) / 2} ${y + (CAIXA - M_ALTURA) / 2}) scale(${M_LARGURA / 48})">
    <path d="${MARK_PATH}" stroke="${FUNDO}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  </g>
</svg>`;

const splash = await sharp(Buffer.from(svg)).png().toBuffer();

// As duas versões apontam para o mesmo arquivo: a Mimu abre escura nos dois
// temas, porque quem abre ainda não escolheu tema nenhum.
await sharp(splash).toFile("assets/splash.png");
await sharp(splash).toFile("assets/splash-dark.png");

const meta = await sharp("assets/icon.png").metadata();
console.log(`assets/icon.png — ${meta.width}×${meta.height}, alfa: ${meta.hasAlpha}`);
console.log(`assets/splash.png — ${LADO_SPLASH}×${LADO_SPLASH}, marca de ${CAIXA}px sobre ${FUNDO}`);
console.log("\nAgora: npx @capacitor/assets generate --ios");
