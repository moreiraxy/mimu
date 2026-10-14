/**
 * A rotina acordada no papel, das 9:30 às 18:00.
 *
 * Vem do documento de funções de 30/09/2026 — "Assistente da Gerência de
 * Vendas", equipe Dyego Gomes. Está em código, e não no banco, porque é o
 * acordo de trabalho: muda numa conversa com o gerente, e mudar o acordo deve
 * aparecer num commit, não numa linha de tabela que ninguém revisou.
 *
 * O FUSO IMPORTA. O servidor roda em UTC e, entre 21h e a meia-noite de
 * Brasília, ele já está no dia seguinte — o defeito que já fez a Mimu dizer
 * "faturamento do dia está em R$ 0,00" num dia com R$ 707,00 (ver lib/datas.ts
 * e a correção de 10/09/2026). Aqui nenhuma função chama `getHours()` cru:
 * quem manda é o relógio de São Paulo.
 */

const FUSO_BRASIL = "America/Sao_Paulo";

/** Minutos desde a meia-noite, no fuso de Brasília. */
export function minutosAgoraNoBrasil(agora: Date = new Date()): number {
  const [hora, minuto] = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_BRASIL,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(agora)
    .split(":")
    .map(Number);
  return hora! * 60 + minuto!;
}

/** Dia da semana no fuso de Brasília: 0 domingo … 6 sábado. */
export function diaDaSemanaNoBrasil(agora: Date = new Date()): number {
  const dia = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO_BRASIL,
    weekday: "short",
  }).format(agora);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(dia);
}

export function ehFimDeSemanaNoBrasil(agora: Date = new Date()): boolean {
  const dia = diaDaSemanaNoBrasil(agora);
  return dia === 0 || dia === 6;
}

function hm(texto: string): number {
  const [h, m] = texto.split(":").map(Number);
  return h! * 60 + m!;
}

export function paraHora(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * `conferencia` são os quatro momentos de olhar a fila — 9:45, 12:00, 14:45 e
 * 17:00. Ganham tratamento próprio na tela porque são pontuais e silenciosos:
 * ninguém reclama na hora em que eles não acontecem, e o preço aparece dias
 * depois, num lead parado na fila de alguém que já foi cortado.
 */
export type TipoBloco = "bloco" | "conferencia" | "entrega";

export interface BlocoDaRotina {
  chave: string;
  inicio: number;
  /** Fim do bloco. Nos momentos pontuais, é o próprio início + folga. */
  fim: number;
  label: string;
  detalhe: string;
  tipo: TipoBloco;
}

/**
 * Os dez blocos, em ordem. `fim` dos momentos pontuais é a folga que eu dou
 * antes de chamar de atrasado: 15 minutos para a roleta das 9:45 e 10 para as
 * conferências de fila. Sem folga nenhuma, a tela acusaria atraso às 9:46 de
 * uma pessoa que está exatamente em cima do horário.
 */
export const ROTINA: BlocoDaRotina[] = [
  {
    chave: "email_agenda",
    inicio: hm("09:30"),
    fim: hm("09:45"),
    label: "E-mail, leads da noite e agenda do gerente",
    detalhe:
      "Leads que entraram fora do horário têm prioridade: chegaram sem ninguém para atender.",
    tipo: "bloco",
  },
  {
    chave: "roleta_manha",
    inicio: hm("09:45"),
    fim: hm("10:00"),
    label: "Roleta da manhã — conferir a ordem da fila",
    detalhe: "Depois da roleta, a fila precisa bater com a regra.",
    tipo: "conferencia",
  },
  {
    chave: "pre_atendimento_disparo",
    inicio: hm("10:00"),
    fim: hm("12:00"),
    label: "Pré-atendimento dos leads novos e disparo do dia",
    detalhe:
      "Cinco perguntas: objetivo, entrada, prazo, região ou produto, melhor horário. Sem simulação, sem preço fechado, sem prometer unidade.",
    tipo: "bloco",
  },
  {
    chave: "fila_corte_12",
    inicio: hm("12:00"),
    fim: hm("12:10"),
    label: "Conferir se quem foi cortado saiu da fila",
    detalhe: "Lead de quem foi cortado e ficou na fila é lead que ninguém atende.",
    tipo: "conferencia",
  },
  {
    chave: "ativacao",
    inicio: hm("12:00"),
    fim: hm("14:30"),
    label: "Ativação de base e carteira",
    detalhe:
      "Parados em Contato há 5 dias ou mais, Trilha B do playbook, poucas mensagens por dia. O almoço cabe aqui dentro.",
    tipo: "bloco",
  },
  {
    chave: "roleta_tarde",
    inicio: hm("14:45"),
    fim: hm("15:00"),
    label: "Roleta da tarde — conferir a fila",
    detalhe: "Mesma conferência da manhã, depois da roleta da tarde.",
    tipo: "conferencia",
  },
  {
    chave: "burocracia",
    inicio: hm("15:00"),
    fim: hm("17:00"),
    label: "E-mails, documentação, pastas, agenda e materiais",
    detalhe:
      "Terceira triagem da caixa. Rascunho pronto do que depende do gerente. Confirmação de reunião da véspera.",
    tipo: "bloco",
  },
  {
    chave: "fila_17",
    inicio: hm("17:00"),
    fim: hm("17:10"),
    label: "Conferir a fila de novo",
    detalhe: "O corte das 19h é de outro executivo — esta é a última sua.",
    tipo: "conferencia",
  },
  {
    chave: "sla",
    inicio: hm("17:00"),
    fim: hm("17:45"),
    label: "Varredura de SLA e atualização de etapas",
    detalhe:
      "Quem estourou duas vezes vai para rodízio. A cobrança é direto com o executivo.",
    tipo: "bloco",
  },
  {
    chave: "resumo",
    inicio: hm("17:45"),
    fim: hm("18:00"),
    label: "Enviar o resumo do dia ao gerente",
    detalhe: "A tela monta o rascunho com o que você marcou e com os números.",
    tipo: "entrega",
  },
];

export const INICIO_DA_JORNADA = hm("09:30");
export const FIM_DA_JORNADA = hm("18:00");

export interface EstadoDaRotina {
  /** O bloco em que o relógio está agora. Nulo fora da jornada. */
  agora: BlocoDaRotina | null;
  /** Blocos simultâneos ao de agora (12:00 tem dois: o corte e a ativação). */
  tambemAgora: BlocoDaRotina[];
  proximo: BlocoDaRotina | null;
  /** Já passou da hora e não foi marcado como feito. */
  atrasados: BlocoDaRotina[];
  /** Ainda não chegou a hora. */
  aVir: BlocoDaRotina[];
  feitos: BlocoDaRotina[];
  antesDaJornada: boolean;
  depoisDaJornada: boolean;
}

/**
 * Onde o dia está, dado o relógio e o que já foi marcado.
 *
 * Função pura, e por isso testável: recebe o instante em vez de chamar
 * `new Date()` por dentro. Um teste que dependesse do relógio passaria de
 * manhã e falharia de tarde — que é justamente o defeito que ele pega.
 */
export function estadoDaRotina(
  feitas: string[],
  agora: Date = new Date(),
): EstadoDaRotina {
  const minutos = minutosAgoraNoBrasil(agora);
  const feito = new Set(feitas);

  const emAndamento = ROTINA.filter(
    (b) => minutos >= b.inicio && minutos < b.fim && !feito.has(b.chave),
  );

  return {
    agora: emAndamento[0] ?? null,
    tambemAgora: emAndamento.slice(1),
    proximo: ROTINA.find((b) => b.inicio > minutos) ?? null,
    atrasados: ROTINA.filter((b) => minutos >= b.fim && !feito.has(b.chave)),
    aVir: ROTINA.filter((b) => b.inicio > minutos && !feito.has(b.chave)),
    feitos: ROTINA.filter((b) => feito.has(b.chave)),
    antesDaJornada: minutos < INICIO_DA_JORNADA,
    depoisDaJornada: minutos >= FIM_DA_JORNADA,
  };
}

/**
 * A regra de prioridade está escrita no documento e vence qualquer bloco:
 * "lead novo passa na frente". A tela repete isso em voz alta porque é a única
 * regra do cargo que autoriza abandonar o que está em andamento.
 */
export const REGRA_DE_PRIORIDADE =
  "Lead novo passa na frente de qualquer bloco.";
