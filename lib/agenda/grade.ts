import type { AgendamentoComCliente } from "@/types";

/**
 * A matemática da grade de horário — separada da tela de propósito.
 *
 * Ela mora aqui, e não dentro do componente, porque é a parte que erra em
 * silêncio: se o empacotamento falhar, duas reuniões no mesmo horário ficam
 * uma EM CIMA da outra e a de baixo desaparece — sem erro, sem aviso, sem
 * sobrar nada na tela que diga que ela existe. A pessoa então marca um
 * terceiro compromisso num horário que já tinha dois.
 *
 * Em lib/ ela é testável sem navegador (ver testes/agenda-em-grade.test.ts).
 */

/** Duração assumida quando o agendamento não declara uma. */
export const DURACAO_PADRAO_MINUTOS = 60;
/** Mínimo visível: menos de 30min não dá para ler nem para tocar. */
export const DURACAO_MINIMA_MINUTOS = 30;

export interface Posicionado {
  item: AgendamentoComCliente;
  /** Minutos desde a meia-noite local. */
  inicio: number;
  fim: number;
  /** Índice da coluna dentro do grupo que se sobrepõe. */
  coluna: number;
  /** Quantas colunas o grupo tem. 1 = largura inteira. */
  colunas: number;
}

export function minutosDoDia(data: Date): number {
  return data.getHours() * 60 + data.getMinutes();
}

export function mesmoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function duracaoVisivel(item: AgendamentoComCliente): number {
  return Math.max(
    item.duracao_minutos ?? DURACAO_PADRAO_MINUTOS,
    DURACAO_MINIMA_MINUTOS,
  );
}

/**
 * Divide a largura entre eventos que se cruzam.
 *
 * Varre em ordem de início acumulando um GRUPO de eventos sobrepostos; quando
 * aparece um que começa depois do fim de TODOS os do grupo, o grupo fecha e a
 * largura volta a ser inteira.
 *
 * Encadeado conta como um grupo só: se A cruza B e B cruza C, os três dividem,
 * mesmo que A não cruze C. É o comportamento do Google, e é o único que impede
 * C de cair em cima de B.
 */
export function posicionar(itens: AgendamentoComCliente[]): Posicionado[] {
  const eventos = itens
    .map((item) => {
      const inicio = minutosDoDia(new Date(item.data_hora));
      return { item, inicio, fim: inicio + duracaoVisivel(item) };
    })
    .sort((a, b) => a.inicio - b.inicio);

  const resultado: Posicionado[] = [];
  let grupo: typeof eventos = [];
  let fimDoGrupo = -1;

  const fecharGrupo = () => {
    grupo.forEach((evento, indice) => {
      resultado.push({ ...evento, coluna: indice, colunas: grupo.length });
    });
    grupo = [];
  };

  for (const evento of eventos) {
    if (grupo.length > 0 && evento.inicio >= fimDoGrupo) {
      fecharGrupo();
      fimDoGrupo = -1;
    }
    grupo.push(evento);
    fimDoGrupo = Math.max(fimDoGrupo, evento.fim);
  }
  fecharGrupo();

  return resultado;
}

/**
 * A faixa de horas que a grade desenha.
 *
 * Abre no padrão e ESTICA para caber o que existe: sem isso, uma reunião às 6h
 * ou um compromisso às 23h simplesmente não apareceria — e não apareceria em
 * silêncio, que é o pior jeito de uma agenda falhar.
 */
export function faixaDeHoras(
  itens: AgendamentoComCliente[],
  padraoInicio = 7,
  padraoFim = 22,
): { horaInicial: number; horaFinal: number } {
  let menor = padraoInicio;
  let maior = padraoFim;
  for (const item of itens) {
    const data = new Date(item.data_hora);
    menor = Math.min(menor, data.getHours());
    maior = Math.max(
      maior,
      Math.ceil((minutosDoDia(data) + duracaoVisivel(item)) / 60),
    );
  }
  return { horaInicial: Math.max(0, menor), horaFinal: Math.min(24, maior) };
}
