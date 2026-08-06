import type { StatusAgendamento } from "@/types";

export const STATUS_CONFIG: Record<
  StatusAgendamento,
  { label: string; corBg: string; corTexto: string; corPonto: string }
> = {
  confirmado: {
    label: "Confirmado",
    corBg: "bg-verde-light",
    corTexto: "text-verde-dark",
    corPonto: "bg-verde",
  },
  pendente: {
    label: "Pendente",
    corBg: "bg-ambar-light",
    corTexto: "text-ambar-text",
    corPonto: "bg-ambar",
  },
  nao_compareceu: {
    label: "Não compareceu",
    corBg: "bg-erro-light",
    corTexto: "text-erro",
    corPonto: "bg-erro",
  },
  concluido: {
    label: "Concluído",
    corBg: "bg-neutro-disabled",
    corTexto: "text-neutro-muted-strong",
    corPonto: "bg-neutro-icon",
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
