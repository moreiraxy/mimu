/**
 * O contrato entre a Mimu e um canal de fora do app.
 *
 * A regra do brief é que o agente NÃO PODE saber que existe WhatsApp: ele
 * recebe uma mensagem normalizada e devolve uma resposta normalizada. Trocar
 * o Baileys pela API oficial da Meta depois deve ser trocar um arquivo, e não
 * reescrever o agente.
 *
 * Isso não é purismo de arquitetura. O Baileys opera fora dos termos da Meta e
 * pode parar de funcionar de um dia para o outro — por mudança de protocolo ou
 * por banimento do número. Quando isso acontecer, o que não pode acontecer
 * junto é a Mimu ficar sem canal enquanto alguém desembaraça regra de negócio
 * de dentro de código de WhatsApp.
 */

/** Os canais que existem. Cresce quando entrar a API oficial ou outro. */
export type Canal = "whatsapp";

/**
 * Uma mensagem que chegou, já sem forma do canal de origem.
 *
 * `canal` e `idNoCanal` seguem aqui porque a idempotência e o log precisam
 * deles — não porque o agente vá olhar. O agente lê `texto` e responde.
 */
export interface MensagemRecebida {
  canal: Canal;
  /** Id que o canal deu à mensagem. Chave de idempotência (ver 4.3). */
  idNoCanal: string;
  /**
   * Quem mandou, no endereçamento do canal. No WhatsApp é o telefone só com
   * dígitos. Nunca vai para log sem mascarar.
   */
  remetente: string;
  /** Vazio quando a mensagem veio em áudio — ver `obterAudio`. */
  texto: string;
  /**
   * Presente quando a mensagem é de voz.
   *
   * É uma FUNÇÃO, e não os bytes, de propósito: transcrever custa por minuto,
   * e quem atende só chama isto depois de confirmar que o número pertence a
   * uma conta. Se os bytes viessem prontos, todo áudio de desconhecido —
   * inclusive número errado e spam — já teria sido baixado e transcrito antes
   * de alguém perguntar se valia a pena.
   */
  obterAudio?: () => Promise<Buffer>;
  recebidaEm: Date;
}

/**
 * O que responder.
 *
 * `null` significa "não responda nada", e é um resultado legítimo: mensagem
 * repetida já processada, ou mensagem que não é para nós. Responder por
 * educação a tudo que chega é o tipo de comportamento que faz um número ser
 * denunciado.
 */
export type RespostaDoAgente = { texto: string } | null;

/**
 * O que quem atende precisa implementar.
 *
 * Recebe a mensagem normalizada e devolve o que dizer. Quem chama é o
 * adaptador do canal; quem implementa não sabe qual é.
 */
export type Atendente = (
  mensagem: MensagemRecebida,
) => Promise<RespostaDoAgente>;

/**
 * Esconde o meio do número.
 *
 * Guarda o começo (país e DDD, que dizem de onde é sem identificar ninguém) e
 * os dois últimos dígitos, que bastam para alguém do suporte confirmar com a
 * pessoa que está falando do número certo.
 *
 * Mora aqui, e não no adaptador do WhatsApp, porque todo canal novo vai
 * precisar da mesma coisa — e porque log com número inteiro é o vazamento que
 * ninguém percebe estar cometendo.
 */
export function mascararRemetente(remetente: string): string {
  const limpo = remetente.replace(/\D/g, "");
  if (limpo.length <= 6) return "*".repeat(limpo.length);
  return `${limpo.slice(0, 4)}${"*".repeat(limpo.length - 6)}${limpo.slice(-2)}`;
}
