import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function diasNoMesAtual(): number {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth() + 1, 0).getDate();
}

/** Data local (não UTC) → "YYYY-MM-DD", sem o shift de fuso de toISOString(). */
export function paraISOLocal(date: Date): string {
  const ano = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0");
  const dia = String(date.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
