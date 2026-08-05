"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthFormState = { error?: string; success?: boolean } | undefined;

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
  return "Algo deu errado. Tente novamente em instantes.";
}

export async function signUp(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const nomeCompleto = String(formData.get("nome_completo") ?? "").trim();
  const nomeNegocio = String(formData.get("nome_negocio") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!nomeCompleto || !nomeNegocio || !email) {
    return { error: "Preencha todos os campos." };
  }
  if (password.length < 6) {
    return { error: "A senha precisa ter no mínimo 6 caracteres." };
  }

  const origin = headers().get("origin");
  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome_completo: nomeCompleto, nome_negocio: nomeNegocio },
      emailRedirectTo: `${origin}/dashboard`,
    },
  });

  if (error) {
    return { error: traduzErroSupabase(error.message) };
  }

  if (!data.session) {
    redirect("/login?confirmacao=pendente");
  }

  redirect("/dashboard");
}

export async function signIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

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
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Digite seu e-mail." };
  }

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
