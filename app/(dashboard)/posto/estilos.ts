/**
 * O vocabulário visual do posto — e ele é diferente do resto do app de
 * propósito.
 *
 * O app é VIDRO: cartões translúcidos de cantos muito redondos flutuando sobre
 * um papel de parede com manchas de luz. Isso foi desenhado para uma tela que
 * se abre três vezes por dia no celular, e funciona lá.
 *
 * O posto é outra coisa: fica aberto oito horas num MacBook, e é onde ela
 * trabalha. O retorno dela sobre a versão em vidro foi "ta zero cara de
 * dashboard" e "eu esperava algo com a cara do notion". Então aqui a regra é a
 * do Notion:
 *
 *   SUPERFÍCIE CHAPADA, não translúcida. Vidro sobre vidro, repetido sete
 *   vezes numa tela densa, vira sopa — e cada desfoque custa pintura numa tela
 *   que atualiza de minuto em minuto.
 *
 *   FIO DE BORDA, não sombra. A separação vem de uma linha de 1px; sombra
 *   empilhada em lista longa cria profundidade falsa e cansa.
 *
 *   CANTO DISCRETO (10px), não 20px. Canto muito redondo é de cartão de
 *   produto; aqui a leitura é de documento.
 *
 *   RÓTULO MIÚDO EM MAIÚSCULA para o que é cabeçalho, e o PESO do texto
 *   fazendo a hierarquia — não a cor. É o que sobra quando a cor sai, e é
 *   justamente o que ela pediu ("preto e branco").
 *
 *   LINHA, não caixa dentro de caixa. Item de lista é uma linha com fio
 *   embaixo. Caixinha dentro de bloco dobra borda e some com o alinhamento.
 *
 * A paleta sem cor vem de outro lugar: `[data-paleta="grafite"]` em
 * globals.css, ligada no layout. Aqui é só forma.
 */

/** O bloco. Chapado, fio de 1px, canto discreto. */
export const BLOCO =
  "rounded-[10px] border border-neutro-border bg-superficie/70 p-4";

/** Cabeçalho de bloco: miúdo, maiúsculo, cinza. */
export const ROTULO =
  "text-[11px] font-bold uppercase tracking-[0.08em] text-neutro-muted";

/** O número ou frase que o bloco existe para mostrar. */
export const VALOR = "text-[22px] font-bold leading-tight text-escuro";

/** Linha de lista, com fio embaixo. O último item perde o fio por `last:`. */
export const LINHA =
  "flex items-center gap-3 border-b border-neutro-border py-2.5 last:border-b-0";

/** Hora em tabular, para as colunas de horário não dançarem. */
export const HORA = "font-mono text-[12px] tabular-nums text-neutro-muted";

/** Selo neutro — o que a cor fazia, agora feito por fundo cinza e peso. */
export const SELO =
  "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide";
