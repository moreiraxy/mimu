import { z } from "zod";

export const schemaCadastro = z.object({
  nomeCompleto: z
    .string()
    .trim()
    .min(1, "Preencha seu nome.")
    .max(120, "Nome muito longo."),
  nomeNegocio: z
    .string()
    .trim()
    .min(1, "Preencha o nome do negócio.")
    .max(120, "Nome muito longo."),
  email: z.string().trim().min(1, "Preencha o e-mail.").email("E-mail inválido.").max(254),
  password: z
    .string()
    .min(6, "A senha precisa ter no mínimo 6 caracteres.")
    .max(72, "Senha muito longa."),
});

export const schemaLogin = z.object({
  email: z.string().trim().min(1, "Digite seu e-mail.").email("E-mail inválido.").max(254),
  password: z.string().min(1, "Digite sua senha.").max(72),
});

export const schemaRecuperarSenha = z.object({
  email: z.string().trim().min(1, "Digite seu e-mail.").email("E-mail inválido.").max(254),
});

/** Primeira mensagem de erro do Zod, pronta pra mostrar no formulário. */
export function primeiroErroZod(erro: z.ZodError): string {
  return erro.issues[0]?.message ?? "Dados inválidos.";
}
