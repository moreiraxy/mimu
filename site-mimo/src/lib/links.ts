/**
 * Destinos que ficam FORA deste SPA.
 *
 * O site-mimo é um app Vite separado, com as rotas `/`, `/historias`,
 * `/historias/:slug` e `/legal/:slug`. O cadastro mora no app principal
 * (app/(auth)/cadastro, Next.js), então navegar pra ele com o `<Link>` do
 * react-router daria 404 dentro do SPA — tem que ser navegação de página
 * inteira (`<a href>`), que é o que `ehExterno()` decide.
 */
export const CADASTRO = "/cadastro";

/** Rotas que este SPA realmente resolve; o resto sai com navegação cheia. */
const ROTAS_INTERNAS = ["/", "/historias", "/legal"];

export function ehExterno(destino: string) {
  if (destino.startsWith("http") || destino.startsWith("#") || destino.startsWith("mailto:")) return true;
  return !ROTAS_INTERNAS.some((r) => (r === "/" ? destino === "/" : destino.startsWith(r)));
}
