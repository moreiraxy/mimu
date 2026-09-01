/**
 * Janelas de tempo do dia local, prontas para consultar coluna `timestamptz`.
 *
 * Existe por causa de um bug que apagava atendimentos da tela. As consultas
 * montavam a janela do dia como texto, no formato `2026-08-17T00:00:00`, sem
 * fuso. O Postgres lê texto assim no fuso DELE, que é UTC. Só que o "hoje" era
 * calculado no relógio de quem estava usando o app.
 *
 * No Brasil, três horas de diferença: atendimento marcado para as 21h cai no
 * dia UTC seguinte e desaparecia da "Agenda de hoje". Salão que trabalha à
 * noite perdia justamente os últimos horários. E, do outro lado, o que
 * aconteceu das 21h de ontem em diante aparecia como se fosse hoje.
 *
 * A correção é converter o instante, não formatar o texto: meia-noite local
 * vira um instante absoluto, e `toISOString()` o escreve em UTC com o
 * deslocamento já aplicado.
 */

/**
 * O fuso do Brasil, escrito por extenso — e este é o único lugar do arquivo
 * que NÃO segue o relógio de quem está usando.
 *
 * As outras funções daqui rodam no navegador, onde "hoje" é o dia da pessoa e
 * é isso mesmo que se quer. A cota da Mimu é diferente: ela é contada no
 * SERVIDOR, e o servidor roda em UTC. Meia-noite de UTC são 21h no Brasil —
 * um limite "por dia" calculado com o relógio do servidor zeraria às nove da
 * noite, no meio do expediente de quem fecha o caixa mais tarde. A pessoa
 * veria as mensagens voltarem sozinhas num horário que não significa nada
 * para ela.
 *
 * Não é `-3` fixo de propósito: o Brasil abandonou o horário de verão em 2019,
 * mas gravar o número aqui é apostar que ele não volta. O nome do fuso
 * continua certo se voltar.
 */
const FUSO_BRASIL = "America/Sao_Paulo";

/**
 * O instante em que começou o dia de hoje no Brasil.
 *
 * Devolve o INSTANTE absoluto (em UTC por dentro, como todo `Date`), e não uma
 * data sem fuso: é isso que faz `toISOString()` escrever o horário certo para
 * comparar com uma coluna `timestamptz`, que é a mesma correção que este
 * arquivo inteiro existe para fazer.
 *
 * A conta é "quanto do dia já passou no relógio de lá, subtraído de agora".
 * Simples e sem depender de montar texto de data.
 */
export function inicioDoDiaNoBrasil(agora: Date = new Date()): Date {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_BRASIL,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(agora);

  const ler = (tipo: string) =>
    Number(partes.find((p) => p.type === tipo)?.value ?? 0);

  const decorrido =
    ler("hour") * 3_600_000 +
    ler("minute") * 60_000 +
    ler("second") * 1_000 +
    agora.getMilliseconds();

  return new Date(agora.getTime() - decorrido);
}

/** Meia-noite de hoje e meia-noite de amanhã, no relógio de quem está usando. */
export function janelaDeHoje(): { inicio: string; fim: string } {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);

  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 1);

  return { inicio: inicio.toISOString(), fim: fim.toISOString() };
}

/**
 * Os últimos `dias` dias, terminando no fim de hoje.
 *
 * `dias = 7` devolve hoje mais os seis anteriores, que é o mesmo período das
 * sete barras do resumo semanal.
 */
export function janelaDosUltimosDias(dias: number): {
  inicio: Date;
  fim: Date;
} {
  const fim = new Date();
  fim.setHours(0, 0, 0, 0);
  fim.setDate(fim.getDate() + 1);

  const inicio = new Date(fim);
  inicio.setDate(inicio.getDate() - dias);

  return { inicio, fim };
}
