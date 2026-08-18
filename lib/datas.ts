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
