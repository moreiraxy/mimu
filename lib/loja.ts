/**
 * Os endereços da Mimu nas lojas de aplicativo.
 *
 * Ficam num arquivo só porque, no dia da publicação, é UM lugar para acertar
 * — e porque cada tela que precisar disso vai precisar da mesma resposta:
 * "já dá para avaliar?".
 *
 * Os dois são `null` de propósito enquanto a Mimu não está publicada. O id da
 * App Store só existe depois do primeiro envio aceito, e um link inventado
 * agora levaria a pessoa a uma página de erro da Apple — que é pior do que
 * não oferecer o caminho. As telas perguntam antes de mostrar.
 */

/** O id numérico que a App Store dá ao app. Preencher no dia do primeiro envio. */
export const ID_APP_STORE: string | null = null;

/** O nome do pacote na Play Store — o mesmo `appId` do capacitor.config.ts. */
export const PACOTE_PLAY_STORE: string | null = null;

/**
 * O link que abre a Mimu já com a folha de avaliação aberta, ou null se ainda
 * não há loja.
 *
 * `action=write-review` é o que faz a App Store abrir direto no campo de
 * escrever, em vez de na página do app — de onde quase ninguém acha o botão.
 */
export function linkAvaliacaoAppStore(): string | null {
  if (!ID_APP_STORE) return null;
  return `https://apps.apple.com/app/id${ID_APP_STORE}?action=write-review`;
}

export function linkAvaliacaoPlayStore(): string | null {
  if (!PACOTE_PLAY_STORE) return null;
  return `https://play.google.com/store/apps/details?id=${PACOTE_PLAY_STORE}`;
}
