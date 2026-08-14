"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { excedeuLimite, registrarTentativa } from "@/lib/rate-limit";
import { planoValido } from "@/lib/planos";
import { avisarAdminsNovoCadastro } from "@/lib/admin-avisos";
import {
  primeiroErroZod,
  schemaCadastro,
  schemaLogin,
  schemaRecuperarSenha,
} from "@/lib/validacao/auth";

export type AuthFormState = { error?: string; success?: boolean } | undefined;

/** IP do cliente a partir dos headers de proxy — "desconhecido" só acontece em ambientes sem proxy (ex.: dev local sem Vercel). */
function obterIP(): string {
  const encaminhadoPor = headers().get("x-forwarded-for");
  if (encaminhadoPor) return encaminhadoPor.split(",")[0]!.trim();
  return headers().get("x-real-ip") ?? "desconhecido";
}

function traduzErroSupabase(message: string): string {
  if (message.includes("already registered")) {
    return "Esse e-mail já está cadastrado. Que tal entrar na sua conta?";
  }
  if (message.includes("Invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (message.includes("Password should be at least")) {
    return "A senha precisa ter no mínimo 6 caracteres.";
  }

  // Fora de produção, mostra a mensagem real do Supabase para facilitar
  // debug — em produção mantém a mensagem genérica (a Mimu nunca fala como
  // um sistema, ver brand/Mimu Sistema de Design.dc.html).
  if (process.env.NODE_ENV !== "production") {
    return `Algo deu errado: ${message}`;
  }
  return "Algo deu errado. Tente novamente em instantes.";
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validacao = schemaCadastro.safeParse({
    nomeCompleto: formData.get("nome_completo"),
    nomeNegocio: formData.get("nome_negocio"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validacao.success) {
    return { error: primeiroErroZod(validacao.error) };
  }

  const { nomeCompleto, nomeNegocio, email, password } = validacao.data;

  // Plano escolhido na landing. Passa pela lista branca: qualquer coisa fora
  // dela vira null, e null é tratado como "escolheu o grátis". Guardar aqui
  // não é decisão de dinheiro — o preço quem define é o servidor, na hora do
  // pagamento (lib/planos.ts). Isto só decide se a conta ganha ou não os 7
  // dias de teste, e escolher o grátis é uma opção aberta a qualquer pessoa.
  const plano = planoValido(formData.get("plano"));

  const ip = obterIP();
  if (await excedeuLimite("cadastro", ip)) {
    return {
      error: "Muitos cadastros tentados por aqui. Tente novamente em uma hora.",
    };
  }
  await registrarTentativa("cadastro", ip);

  const origin = headers().get("origin");
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome_completo: nomeCompleto,
        nome_negocio: nomeNegocio,
        plano_escolhido: plano,
      },
      emailRedirectTo: `${origin}/onboarding`,
    },
  });

  if (error) {
    console.error("[cadastro] erro completo do Supabase Auth:", {
      name: error.name,
      status: error.status,
      code: (error as { code?: string }).code,
      message: error.message,
      cause: error.cause,
    });
    return { error: traduzErroSupabase(error.message) };
  }

  // Cadastro deu certo — avisa os admins. `await` de propósito (e não
  // fire-and-forget): numa Server Action a resposta pode encerrar antes de
  // uma promessa solta terminar, e o aviso se perderia. A função inteira é
  // silenciosa por dentro, então isso não tem como quebrar o cadastro.
  await avisarAdminsNovoCadastro(nomeNegocio);

  if (!data.session) {
    redirect("/login?confirmacao=pendente");
  }

  redirect("/onboarding");
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validacao = schemaLogin.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validacao.success) {
    return { error: primeiroErroZod(validacao.error) };
  }

  const { email, password } = validacao.data;

  if (await excedeuLimite("login", email)) {
    return {
      error: "Muitas tentativas de login. Tente novamente em uma hora.",
    };
  }
  await registrarTentativa("login", email);

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: traduzErroSupabase(error.message) };
  }

  redirect("/dashboard");
}

export async function requestPasswordReset(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const validacao = schemaRecuperarSenha.safeParse({
    email: formData.get("email"),
  });

  if (!validacao.success) {
    return { error: primeiroErroZod(validacao.error) };
  }

  const { email } = validacao.data;

  const origin = headers().get("origin");
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/redefinir-senha`,
  });

  if (error) {
    return { error: "Não foi possível enviar o link agora. Tente de novo." };
  }

  return { success: true };
}
