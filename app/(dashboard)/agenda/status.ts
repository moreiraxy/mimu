import type { StatusAgendamento } from "@/types";

/*
 * O selo de status na linguagem do app.
 *
 * Os quatro estados vinham com o par fundo-claro + texto-escuro da mesma cor:
 * verde no confirmado, âmbar no pendente, vermelho no faltou. Sobre vidro
 * escuro, "Confirmado" saía verde-escuro sobre verde-água — quase ilegível — e
 * um dia com cinco agendamentos virava uma fila de bandeirinhas coloridas
 * disputando atenção com os nomes das clientes, que é o que se lê ali.
 *
 * Agora só o estado ATIVO acende, em néon. Os outros três são neutros e se
 * distinguem pelo brilho do texto: pendente ainda é assunto (texto cheio),
 * concluído e faltou já passaram (texto apagado). O ponto colorido da fita da
 * semana continua fazendo a separação fina, que ali é o único espaço que tem.
 */
export const STATUS_CONFIG: Record<
  StatusAgendamento,
  { label: string; corBg: string; corTexto: string; corPonto: string }
> = {
  confirmado: {
    label: "Confirmado",
    corBg: "bg-primary/20",
    corTexto: "text-primary-forte",
    corPonto: "bg-primary",
  },
  pendente: {
    label: "Pendente",
    corBg: "bg-white/[0.10]",
    corTexto: "text-escuro",
    corPonto: "bg-white/60",
  },
  nao_compareceu: {
    label: "Não compareceu",
    corBg: "bg-white/[0.06]",
    corTexto: "text-neutro-muted",
    corPonto: "bg-white/25",
  },
  concluido: {
    label: "Concluído",
    corBg: "bg-white/[0.06]",
    corTexto: "text-neutro-muted",
    corPonto: "bg-white/35",
  },
};

export const OPCOES_DURACAO = [
  { label: "30min", minutos: 30 },
  { label: "1h", minutos: 60 },
  { label: "1h30", minutos: 90 },
  { label: "2h", minutos: 120 },
];

export function formatarDuracao(minutos: number | null): string {
  if (!minutos) return "";
  const opcao = OPCOES_DURACAO.find((o) => o.minutos === minutos);
  if (opcao) return opcao.label;
  return `${minutos}min`;
}

/** Horários de 07:00 a 20:00 em intervalos de 30min. */
export function gerarHorarios(): string[] {
  const horarios: string[] = [];
  for (let h = 7; h <= 20; h++) {
    horarios.push(`${String(h).padStart(2, "0")}:00`);
    if (h < 20) horarios.push(`${String(h).padStart(2, "0")}:30`);
  }
  return horarios;
}
