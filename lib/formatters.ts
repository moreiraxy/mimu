import { diasNoMesAtual } from "@/lib/utils";

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const formatadorDataLonga = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
});

const formatadorDataComDiaSemana = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
});

/**
 * "YYYY-MM-DD" é interpretado como UTC pelo construtor nativo de Date, o que
 * pode "voltar" um dia em fusos negativos (todo o Brasil). Forçamos meia-noite
 * local quando a string não tem componente de horário.
 */
function parseDataLocal(date: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return new Date(`${date}T00:00:00`);
  }
  return new Date(date);
}

/** 1234.5 → "R$ 1.234,50" */
export function formatCurrency(value: number): string {
  return formatadorMoeda.format(value);
}

/** "2026-08-05" → "05 de agosto" */
export function formatDate(date: string): string {
  return formatadorDataLonga.format(parseDataLocal(date));
}

/** "2026-08-05" → "05/08" */
export function formatDateShort(date: string): string {
  const d = parseDataLocal(date);
  const dia = String(d.getDate()).padStart(2, "0");
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  return `${dia}/${mes}`;
}

/** "2026-08-05T14:30:00Z" → "14h30" */
export function formatTime(datetime: string): string {
  const d = parseDataLocal(datetime);
  const horas = String(d.getHours()).padStart(2, "0");
  const minutos = String(d.getMinutes()).padStart(2, "0");
  return `${horas}h${minutos}`;
}

/** Distância em dias entre `date` e hoje, em linguagem natural. */
export function formatRelativeDate(date: string): string {
  const alvo = parseDataLocal(date);
  const hoje = new Date();

  const inicioAlvo = new Date(
    alvo.getFullYear(),
    alvo.getMonth(),
    alvo.getDate(),
  );
  const inicioHoje = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate(),
  );

  const diffDias = Math.round(
    (inicioHoje.getTime() - inicioAlvo.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDias === 0) return "hoje";
  if (diffDias === 1) return "ontem";
  if (diffDias > 1) return `há ${diffDias} dias`;
  if (diffDias === -1) return "amanhã";
  return `em ${Math.abs(diffDias)} dias`;
}

/** Meta mensal dividida pelos dias do mês corrente. */
export function calcularMetaDiaria(metaMensal: number): number {
  if (metaMensal <= 0) return 0;
  return Number((metaMensal / diasNoMesAtual()).toFixed(2));
}

/** Saudação baseada no horário local do dispositivo. */
export function saudacaoPorHorario(date: Date = new Date()): string {
  const hora = date.getHours();
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
}

/** `new Date()` → "Terça, 05 de agosto" (usa o fuso local do navegador). */
export function formatDataComDiaSemana(date: Date = new Date()): string {
  const partes = formatadorDataComDiaSemana.formatToParts(date);
  const diaSemana = partes.find((p) => p.type === "weekday")?.value ?? "";
  const dia = partes.find((p) => p.type === "day")?.value ?? "";
  const mes = partes.find((p) => p.type === "month")?.value ?? "";

  const diaSemanaCurto = diaSemana.replace("-feira", "");
  const diaSemanaCapitalizado =
    diaSemanaCurto.charAt(0).toUpperCase() + diaSemanaCurto.slice(1);

  return `${diaSemanaCapitalizado}, ${dia} de ${mes}`;
}

/** Digitação livre → "(11) 91234-5678" / "(11) 1234-5678", conforme a quantidade de dígitos. */
export function formatarTelefoneBR(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}

/** `created_at` → "3 anos", "8 meses", "2 semanas"... — granularidade decrescente. */
export function formatTempoCliente(dataCriacao: string): string {
  const criacao = new Date(dataCriacao);
  const hoje = new Date();

  const meses =
    (hoje.getFullYear() - criacao.getFullYear()) * 12 +
    (hoje.getMonth() - criacao.getMonth());

  if (meses >= 24) return `${Math.floor(meses / 12)} anos`;
  if (meses >= 12) return "1 ano";
  if (meses >= 2) return `${meses} meses`;
  if (meses === 1) return "1 mês";

  const dias = Math.floor(
    (hoje.getTime() - criacao.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (dias >= 14) return `${Math.floor(dias / 7)} semanas`;
  if (dias >= 7) return "1 semana";
  return dias <= 1 ? "cliente nova" : `${dias} dias`;
}
