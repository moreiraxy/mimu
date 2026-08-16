/**
 * O roteiro. É este arquivo que você edita para mudar o vídeo.
 *
 * Cada trecho tem o texto que VOCÊ narra e o intervalo em que ele acontece.
 * Os quadros (frames) são a 30 por segundo: o trecho que começa em 150 começa
 * aos 5 segundos. Mudar `duracaoEmQuadros` de um trecho empurra os seguintes
 * sozinho, porque os inícios são calculados a partir das durações e não
 * escritos à mão.
 *
 * A narração está contada para um ritmo calmo, de umas 2,6 palavras por
 * segundo. Se você falar mais rápido ou mais devagar, mexa nas durações aqui
 * e o vídeo inteiro se reorganiza.
 */
export const FPS = 30;

export interface Trecho {
  id: string;
  /** O que você fala por cima. */
  narracao: string;
  /** Quanto tempo o trecho ocupa, em quadros (30 = 1 segundo). */
  duracaoEmQuadros: number;
}

export const TRECHOS: Trecho[] = [
  {
    id: "pergunta",
    narracao:
      "Você abre o seu negócio todo dia. Mas quem cuida das contas dele?",
    duracaoEmQuadros: 5 * FPS,
  },
  {
    id: "bagunca",
    narracao:
      "O caixa no caderno. Os horários no WhatsApp. E o quanto sobrou no fim do mês, só na sua cabeça.",
    duracaoEmQuadros: 7 * FPS,
  },
  {
    id: "marca",
    narracao: "A Mimu junta tudo num lugar só.",
    duracaoEmQuadros: 4 * FPS,
  },
  {
    id: "ia",
    narracao:
      "E você não precisa aprender nada. Só perguntar. Quanto vendi essa semana? Tem alguma cliente sumida? Ela responde na hora, com os números do seu negócio.",
    duracaoEmQuadros: 10 * FPS,
  },
  {
    id: "fecho",
    narracao: "Mimu. Enquanto você trabalha, ela cuida do seu negócio.",
    duracaoEmQuadros: 4 * FPS,
  },
];

export const DURACAO_TOTAL = TRECHOS.reduce(
  (total, t) => total + t.duracaoEmQuadros,
  0,
);

/** Quadro em que cada trecho começa, somando as durações dos anteriores. */
export function inicios(): Record<string, number> {
  const mapa: Record<string, number> = {};
  let acumulado = 0;
  for (const t of TRECHOS) {
    mapa[t.id] = acumulado;
    acumulado += t.duracaoEmQuadros;
  }
  return mapa;
}

export function duracao(id: string): number {
  return TRECHOS.find((t) => t.id === id)!.duracaoEmQuadros;
}
