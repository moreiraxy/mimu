/**
 * Como falar com a Mimu, num lugar só.
 *
 * Existia espalhado, e todos os pontos apontavam para `@mimu.app`, que é um
 * domínio de outra empresa. Quem clicava em "Falar com suporte" abria o
 * aplicativo de e-mail e mandava mensagem para o vazio. Numa tela de cobrança
 * vencida isso é pior do que não ter link nenhum: a pessoa está sem acesso e
 * acha que pediu ajuda.
 *
 * O WhatsApp é o canal de verdade, então é ele que aparece.
 */

/** Só dígitos, no formato que o link do WhatsApp exige. */
export const WHATSAPP_NUMERO = "5511920924833";

/** Como mostrar para uma pessoa ler. */
export const WHATSAPP_VISIVEL = "(11) 92092-4833";

/**
 * Link do WhatsApp com a mensagem já escrita.
 *
 * O texto vai preenchido porque quem chega aqui está travado e com pressa. Ter
 * que explicar a própria situação antes de pedir ajuda é atrito no pior momento
 * possível, e o contexto ajuda quem responde a resolver na primeira mensagem.
 */
export function linkWhatsApp(mensagem: string): string {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
}
