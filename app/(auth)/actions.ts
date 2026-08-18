"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { excedeuLimite, registrarTentativa } from "@/lib/rate-limit";
import { planoValido } from "@/lib/planos";
import { destinoAposLogin } from "@/lib/destino-pos-login";
import { avisarAdminsNovoCadastro } from "@/lib/admin-avisos";
import { registrarEvento } from "@/lib/eventos";
import {
  primeiroErroZod,
  schemaCadastro,
  schemaLogin,
  schemaRecuperarSenha,
} from "@/lib/validacao/auth";

export type AuthFormState =
  | {
      error?: string;
      success?: boolean;
      /**
       * Liga o botão de reenviar confirmação na tela de login. É diferente de
       * um erro comum: a senha está certa, só falta confirmar o e-mail, e
       * quem cai aqui precisa de um caminho, não de uma mensagem.
       */
      precisaConfirmar?: boolean;
    }
  | undefined;

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
  if (message.includes("Email not confirmed")) {
    return "Falta confirmar seu e-mail. Procure a mensagem que enviamos.";
  }
  // O Supabase limita quantos e-mails saem por hora. Com o servidor de e-mail
  // padrão dele esse teto é baixo, e quando estoura a conta é criada mas o
  // e-mail de confirmação nunca chega — a pessoa fica presa sem saber por quê.
  if (message.includes("rate limit") || message.includes("Too many requests")) {
    return "Muitos cadastros em pouco tempo. Espere alguns minutos e tente de novo.";
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
    // O cadastro ficou três dias quebrado sem nada avisar. Este registro é o
    // que faz uma falha assim aparecer no painel em vez de só no log.
    await registrarEvento("cadastro_falhou", {
      detalhe: {
        motivo: error.message,
        status: error.status ?? null,
        codigo: (error as { code?: string }).code ?? null,
      },
    });
    return { error: traduzErroSupabase(error.message) };
  }

  // Cadastro deu certo — avisa os admins. `await` de propósito (e não
  // fire-and-forget): numa Server Action a resposta pode encerrar antes de
  // uma promessa solta terminar, e o aviso se perderia. A função inteira é
  // silenciosa por dentro, então isso não tem como quebrar o cadastro.
  await registrarEvento("cadastro", {
    userId: data.user?.id ?? null,
    detalhe: { negocio: nomeNegocio, plano: plano || null },
  });
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
    await registrarEvento("login_falhou", {
      detalhe: {
        motivo: error.message,
        precisaConfirmar: error.message.includes("Email not confirmed"),
      },
    });
    return {
      error: traduzErroSupabase(error.message),
      precisaConfirmar: error.message.includes("Email not confirmed"),
    };
  }

  const { data: entrou } = await supabase.auth.getUser();
  await registrarEvento("login", { userId: entrou.user?.id ?? null });

  // Veio de um plano da landing: o destino é o checkout, não o painel. Quem
  // clicou em "Seja Pro" e entrou na conta quer assinar, não olhar o dia.
  const planoLogin = planoValido(formData.get("plano"));
  if (planoLogin) {
    redirect(`/assinar?plano=${planoLogin}`);
  }

  // Sem plano na mão, o destino sai do estado da conta. Mandar todo mundo
  // pro /dashboard fazia quem tem pagamento pendente entrar no painel e só
  // ser barrada ao recarregar a página.
  redirect(
    entrou.user ? await destinoAposLogin(supabase, entrou.user.id) : "/dashboard",
  );
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

  /*
   * Teto por e-mail pedido. Não existia, e cada pedido dispara uma mensagem.
   *
   * A resposta é a MESMA de quando dá certo, de propósito: dizer "muitos
   * pedidos para este e-mail" confirmaria que a conta existe, e transformaria
   * esta tela num verificador de cadastro. Quem estourou o limite
   * simplesmente não recebe o e-mail.
   */
  if (await excedeuLimite("recuperar_senha", email)) {
    return { success: true };
  }
  await registrarTentativa("recuperar_senha", email);

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

/**
 * Reenvia o e-mail de confirmação.
 *
 * Existe porque a confirmação pode falhar sem culpa de ninguém: o e-mail cai
 * no spam, ou o limite de envio do Supabase estoura e a mensagem nem sai. Sem
 * um jeito de pedir de novo, a conta fica criada e inacessível para sempre.
 *
 * A resposta é a mesma dando certo ou errado de propósito: dizer "esse e-mail
 * não existe" transformaria esta tela num jeito de descobrir quem tem conta
 * na Mimu.
 */
export async function reenviarConfirmacao(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Escreva seu e-mail primeiro." };
  }

  // Mesmo limite do login: sem isso, o botão vira um jeito de disparar
  // e-mail em cima de qualquer endereço.
  if (await excedeuLimite("login", email)) {
    return { error: "Muitas tentativas. Espere alguns minutos." };
  }
  await registrarTentativa("login", email);

  const origin = headers().get("origin");
  const supabase = createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/onboarding` },
  });

  if (error) {
    console.error("Falha ao reenviar confirmação:", error.message);
    if (error.message.includes("rate limit")) {
      return { error: "Já enviamos há pouco. Espere alguns minutos." };
    }
  }

  return { success: true };
}
