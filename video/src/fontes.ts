import { staticFile, delayRender, continueRender } from "remotion";

/**
 * Carrega as fontes da marca antes de o Remotion desenhar o primeiro quadro.
 *
 * `delayRender` existe por isso: sem ele o render começa com a fonte do
 * sistema e só troca depois, e como cada quadro é uma foto independente, o
 * vídeo sairia com os primeiros segundos numa fonte e o resto em outra. Aqui
 * não dá para "piscar e corrigir" como numa página.
 */
const ARQUIVOS: [string, string, string][] = [
  ["Geist", "fonts/geist.woff2", "U+0000-00FF, U+0131, U+0152-0153, U+2000-206F, U+20AC, U+2122"],
  ["Geist", "fonts/geist-ext.woff2", "U+0100-02BA, U+1E00-1E9F, U+2C60-2C7F, U+A720-A7FF"],
  ["Geist Mono", "fonts/geist-mono.woff2", "U+0000-00FF, U+0131, U+0152-0153, U+2000-206F"],
  ["Indie Flower", "fonts/indie.woff2", "U+0000-00FF, U+0131, U+0152-0153, U+2000-206F"],
];

let carregando: Promise<void> | null = null;

export function carregarFontes(): void {
  if (carregando) return;

  const marcador = delayRender("Carregando as fontes da marca");

  carregando = Promise.all(
    ARQUIVOS.map(async ([familia, caminho, unicodeRange]) => {
      const fonte = new FontFace(familia, `url(${staticFile(caminho)})`, {
        unicodeRange,
        // Geist é variável: um arquivo cobre a faixa inteira de pesos.
        weight: familia === "Indie Flower" ? "400" : "100 900",
      });
      await fonte.load();
      document.fonts.add(fonte);
    }),
  )
    .then(() => continueRender(marcador))
    .catch((erro) => {
      // Falhar aqui em silêncio daria um vídeo inteiro na fonte errada, que é
      // pior do que um render que para e avisa.
      console.error("As fontes da marca não carregaram.", erro);
      continueRender(marcador);
    });
}
