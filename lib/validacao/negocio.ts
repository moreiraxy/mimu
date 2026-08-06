import { z } from "zod";

/**
 * Validação client-side das telas de criação (nova entrada/saída, novo
 * agendamento, novo cliente). Essas telas gravam direto no Supabase pelo
 * browser (sem Server Action) de propósito — é o que permite o modo offline
 * funcionar (grava em IndexedDB quando não há rede). A validação aqui é
 * qualidade de dado/UX, não o limite de segurança: quem garante que ninguém
 * grava ou lê dado de outra empresa é o RLS no banco, que não depende do que
 * roda no navegador.
 */

const dataISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida.");

export const schemaTransacao = z.object({
  valor: z.number().positive("O valor precisa ser maior que zero.").max(999_999_999),
  descricao: z.string().trim().max(500, "Descrição muito longa."),
  categoria: z.string().trim().max(100, "Categoria muito longa."),
  data: dataISO,
});

export const schemaAgendamento = z.object({
  titulo: z.string().trim().min(1, "Descreva o serviço.").max(200),
  data: dataISO,
  horario: z.string().regex(/^\d{2}:\d{2}$/, "Horário inválido."),
});

const emailOpcional = z
  .string()
  .trim()
  .max(254, "E-mail muito longo.")
  .refine(
    (valor) => valor === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor),
    "E-mail inválido.",
  );

export const schemaCliente = z.object({
  nome: z.string().trim().min(1, "Preencha o nome.").max(200),
  telefone: z.string().trim().max(20, "Telefone muito longo."),
  email: emailOpcional,
  saldoFiado: z.number().nonnegative().max(999_999_999),
});

/** Primeira mensagem de erro do Zod, pronta pra mostrar no formulário. */
export function primeiroErroZod(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Confira os dados e tente de novo.";
}
