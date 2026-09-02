"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { reenviarConfirmacao, signIn, type AuthFormState } from "../actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BotoesSociais } from "@/components/auth/BotoesSociais";
import { temLoginSocial } from "@/lib/login-social";

const initialState: AuthFormState = undefined;

function BotaoReenviar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" className="w-full" disabled={pending}>
      {pending ? "Enviando..." : "Reenviar e-mail de confirmação"}
    </Button>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

/**
 * Um recado da tela, na linguagem do app.
 *
 * Eram três blocos de cor cheia — verde-claro no sucesso, âmbar no aviso,
 * vermelho no erro —, as únicas áreas de cor saturada de uma tela que agora é
 * de vidro. Aqui a cor mora no traço da esquerda, e o texto fica legível em
 * cima do material como em todo o resto do produto.
 */
function Recado({
  children,
  tom = "neutro",
}: {
  children: React.ReactNode;
  tom?: "neutro" | "marca";
}) {
  return (
    <p
      className={`rounded-[14px] border-l-[3px] bg-escuro/[0.06] py-2.5 pl-3 pr-3 text-[13px] leading-snug text-escuro ${
        tom === "marca" ? "border-primary" : "border-escuro/25"
      }`}
    >
      {children}
    </p>
  );
}

/**
 * O que dizer quando alguém chega aqui vindo de um link de e-mail que não deu
 * certo. "Inválido" sozinho faria a pessoa achar que o cadastro dela falhou,
 * quando quase sempre o que houve foi demora ou um segundo clique no mesmo
 * link.
 */
const RECADO_DO_LINK: Record<string, string> = {
  "link-expirado":
    "Esse link já foi usado ou passou da validade. Entre com sua senha, ou peça um novo e-mail de confirmação abaixo.",
  "link-invalido":
    "Não consegui ler esse link. Tente abrir de novo pelo e-mail, ou peça um novo abaixo.",
};

export function LoginForm({
  confirmacaoPendente,
  senhaRedefinida,
  plano = "",
  erroDoLink = null,
}: {
  confirmacaoPendente: boolean;
  senhaRedefinida: boolean;
  /** Plano escolhido na landing, repassado para o destino depois do login. */
  plano?: string;
  /** Motivo pelo qual o link do e-mail não funcionou, vindo da URL. */
  erroDoLink?: string | null;
}) {
  const [state, formAction] = useFormState(signIn, initialState);
  const [reenvio, reenviarAction] = useFormState(
    reenviarConfirmacao,
    initialState,
  );
  // O e-mail digitado fica guardado aqui porque o reenvio é um formulário
  // separado: sem isso a pessoa teria que escrever o endereço de novo, logo
  // depois de já ter escrito.
  const [email, setEmail] = useState("");

  const comSocial = temLoginSocial();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-escuro">
          Que bom te ver de novo
        </h1>
        <p className="mt-1 text-[15px] text-neutro-muted">
          Entre para continuar cuidando do seu negócio.
        </p>
      </div>

      {confirmacaoPendente && (
        <Recado tom="marca">
          Conta criada! Confira seu e-mail para confirmar antes de entrar.
        </Recado>
      )}
      {senhaRedefinida && (
        <Recado tom="marca">Senha atualizada. Entre com a sua nova senha.</Recado>
      )}

      {/*
        Apple e Google vêm ANTES do formulário quando existem — é a ordem que
        todo mundo já conhece, e quem tem a conta social não deveria ler o
        formulário inteiro para descobrir que não precisava dele.

        Hoje isto não desenha nada: nenhum provedor está ligado. Ver
        lib/login-social.ts, que é onde o dia de ligar acontece.
      */}
      <BotoesSociais plano={plano} />

      {comSocial && (
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-escuro/[0.12]" />
          {/*
            "ou entre com e-mail", e não "ou". A tela precisa deixar claro que o
            e-mail continua sendo um caminho INTEIRO, e não uma alternativa de
            segunda para quem não tem conta do Google.
          */}
          <span className="text-[13px] text-neutro-muted">
            ou entre com e-mail
          </span>
          <span className="h-px flex-1 bg-escuro/[0.12]" />
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="plano" value={plano} />
        <Input
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {erroDoLink && RECADO_DO_LINK[erroDoLink] && (
          <Recado>{RECADO_DO_LINK[erroDoLink]}</Recado>
        )}
        {state?.error && <Recado>{state.error}</Recado>}
        <SubmitButton />
      </form>

      {/* Só aparece quando o login falhou por falta de confirmação. É o
          caminho de saída de quem não recebeu o e-mail: sem ele a conta fica
          criada e inacessível, e a pessoa não tem o que fazer. */}
      {state?.precisaConfirmar && !reenvio?.success && (
        <form action={reenviarAction} className="flex flex-col gap-2">
          <input type="hidden" name="email" value={email} />
          <BotaoReenviar />
          {reenvio?.error && (
            <p className="text-center text-[13px] text-neutro-muted">
              {reenvio.error}
            </p>
          )}
        </form>
      )}

      {reenvio?.success && (
        <Recado tom="marca">
          E-mail reenviado. Confira sua caixa de entrada e o spam.
        </Recado>
      )}

      <div className="flex items-center justify-between text-[15px]">
        <Link href="/recuperar-senha" className="font-bold text-primary-forte">
          Esqueci minha senha
        </Link>
        <Link href="/cadastro" className="text-neutro-muted">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
