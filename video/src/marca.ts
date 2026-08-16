/**
 * A marca, em um lugar só.
 *
 * Os valores vêm do app e da landing page (app/globals.css e
 * site-mimo/src/index.css). Ficam copiados aqui, e não importados, porque o
 * projeto de vídeo é independente do build do app de propósito: ele não pode
 * arrastar o Tailwind nem o Next para dentro do Remotion.
 */
export const COR = {
  fundo: "#0A0A0A",
  superficie: "#111111",
  neon: "#CCFF00",
  neonEscuro: "#99CC00",
  tinta: "#FFFFFF",
  apagado: "#888888",
  papel: "#F4F1E8",
} as const;

export const FONTE = {
  display: "Geist, system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
  mao: "'Indie Flower', cursive",
} as const;

/**
 * Tracking por tamanho, não um valor só.
 *
 * Letra grande precisa de espaçamento negativo (ela cresce e as letras
 * parecem se afastar); letra pequena precisa de um pouco de positivo para
 * continuar legível. Um `letter-spacing` fixo estaria errado em algum lugar.
 */
export function tracking(tamanhoPx: number): string {
  if (tamanhoPx >= 90) return "-0.045em";
  if (tamanhoPx >= 56) return "-0.035em";
  if (tamanhoPx >= 32) return "-0.02em";
  if (tamanhoPx >= 20) return "-0.01em";
  return "0.02em";
}

export type Formato = "vertical" | "horizontal";

/**
 * Uma escala por formato em vez de um layout por formato.
 *
 * O 9:16 é estreito e alto: o texto precisa ser proporcionalmente maior para
 * ler no celular, e a composição é vertical. O 16:9 é largo: o mesmo texto no
 * mesmo tamanho relativo ficaria gigante. Em vez de escrever duas versões de
 * cada cena, cada cena pede as medidas daqui.
 */
export function escala(formato: Formato) {
  const vertical = formato === "vertical";
  return {
    vertical,
    /** Multiplicador de tipografia. */
    t: vertical ? 1 : 0.92,
    /** Margem lateral segura. */
    margem: vertical ? 110 : 130,
    /**
     * Altura do mockup de celular.
     *
     * No 16:9 ela precisa caber em 1080 menos as duas margens (820 de sobra),
     * senão o celular é cortado embaixo. Era o que acontecia com 880: a altura
     * era maior que o espaço disponível e o rodapé do app saía do quadro.
     */
    alturaCelular: vertical ? 1180 : 800,
  };
}
