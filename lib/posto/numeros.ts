/**
 * Os seis números pelos quais ela é medida (item 3.10 do documento).
 *
 * São do cargo de Assistente — o único dos cinco que tem meta escrita. Ficam
 * em código pelo mesmo motivo da rotina: mudar a meta é mudar o acordo.
 *
 * `direcao` existe porque dois deles são ao contrário dos outros: no tempo até
 * o primeiro contato e nos e-mails pendentes, menor é melhor. Uma tela que
 * pintasse "15 minutos" de verde porque passou de 10 estaria elogiando o
 * atraso.
 */

export type Periodicidade = "diario" | "semanal" | "por_disparo";
export type Direcao = "maior_melhor" | "menor_melhor";

export interface NumeroDoCargo {
  chave: string;
  label: string;
  /** Como a pessoa lê o valor: minutos, contagem ou porcentagem. */
  unidade: "minutos" | "contagem" | "percentual";
  meta: number | null;
  /** Texto curto da meta, do jeito que o documento escreve. */
  metaTexto: string;
  periodicidade: Periodicidade;
  direcao: Direcao;
  /** Por que este número existe — aparece ao tocar no card. */
  porque: string;
}

export const NUMEROS: NumeroDoCargo[] = [
  {
    chave: "tempo_primeiro_contato",
    label: "Tempo até o primeiro contato",
    unidade: "minutos",
    meta: 10,
    metaTexto: "até 10 minutos",
    periodicidade: "diario",
    direcao: "menor_melhor",
    porque:
      "É o número que o lead sente. Dez minutos é o acordo; acima disso o lead já falou com outro.",
  },
  {
    chave: "leads_qualificados",
    label: "Leads qualificados passados aos executivos",
    unidade: "contagem",
    meta: null,
    metaTexto: "todos os do dia",
    periodicidade: "diario",
    direcao: "maior_melhor",
    porque:
      "A meta não é um número fixo: é zerar a fila do dia. Sobrou lead sem passar, sobrou trabalho.",
  },
  {
    chave: "leads_no_sla",
    label: "Leads dentro do SLA",
    unidade: "percentual",
    meta: 90,
    metaTexto: "90% ou mais",
    periodicidade: "semanal",
    direcao: "maior_melhor",
    porque:
      "Medido na semana, não no dia: um dia ruim não condena, uma semana ruim é padrão.",
  },
  {
    chave: "taxa_resposta_disparo",
    label: "Taxa de resposta dos disparos",
    unidade: "percentual",
    meta: null,
    metaTexto: "por disparo",
    periodicidade: "por_disparo",
    direcao: "maior_melhor",
    porque:
      "Sem meta de propósito: compara disparo com disparo, e é o que diz se o texto novo prestou.",
  },
  {
    chave: "reativados_responderam",
    label: "Leads reativados que voltaram a conversar",
    unidade: "contagem",
    meta: null,
    metaTexto: "semanal",
    periodicidade: "semanal",
    direcao: "maior_melhor",
    porque:
      "É o resultado da ativação de base — o bloco que ocupa duas horas e meia do seu dia.",
  },
  {
    chave: "emails_pendentes",
    label: "E-mails pendentes no fim do dia",
    unidade: "contagem",
    meta: 0,
    metaTexto: "zero",
    periodicidade: "diario",
    direcao: "menor_melhor",
    porque: "É o único com meta absoluta: zero. Qualquer número acima é pendência que dorme.",
  },
];

export function numeroPorChave(chave: string): NumeroDoCargo | undefined {
  return NUMEROS.find((n) => n.chave === chave);
}

/**
 * Bateu a meta? `null` quando o número não tem meta (dois dos seis não têm) ou
 * quando ainda não foi anotado — e a tela precisa dessa diferença: "sem meta"
 * é neutro, "não anotado" é pendência.
 */
export function bateuAMeta(
  numero: NumeroDoCargo,
  valor: number | null | undefined,
): boolean | null {
  if (numero.meta === null || valor === null || valor === undefined) return null;
  return numero.direcao === "menor_melhor"
    ? valor <= numero.meta
    : valor >= numero.meta;
}

export function formatarValor(numero: NumeroDoCargo, valor: number): string {
  if (numero.unidade === "minutos") return `${valor} min`;
  if (numero.unidade === "percentual") return `${valor}%`;
  return String(valor);
}
