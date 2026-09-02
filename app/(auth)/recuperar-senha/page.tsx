"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { requestPasswordReset, type AuthFormState } from "../actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: AuthFormState = undefined;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Enviando..." : "Enviar link de recuperação"}
    </Button>
  );
}

export default function RecuperarSenhaPage() {
  const [state, formAction] = useFormState(requestPasswordReset, initialState);

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 text-primary-forte">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12 L9 17 L20 6"
              stroke="currentColor"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-escuro">Pedido recebido</h1>
        {/*
          "Se existir uma conta" e não "Link enviado".
          
          A tela não pode confirmar quem tem cadastro, senão vira um
          verificador de e-mails. Mas dizer "enviado" quando a conta não existe
          faz a pessoa esperar por um e-mail que nunca foi mandado, e concluir
          que a recuperação de senha está quebrada. Foi o que aconteceu: o
          endereço digitado não tinha conta, e o sucesso na tela escondeu isso.

          O spam é citado porque o remetente é um Gmail comum, sem domínio
          próprio, e a primeira mensagem costuma cair lá.
        */}
        <p className="text-sm text-neutro-muted">
          Se existir uma conta com esse e-mail, o link já está a caminho. Pode
          levar um minuto, e vale olhar na caixa de spam.
        </p>
        <p className="text-xs text-neutro-muted">
          Não chegou? Talvez você tenha se cadastrado com outro endereço.
        </p>
        <Link
          href="/login"
          className="mt-2 text-sm font-medium text-primary-forte"
        >
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-escuro">
          Esqueceu sua senha?
        </h1>
        <p className="mt-1 text-[15px] text-neutro-muted">
          Sem problema. Enviamos um link para você criar uma nova.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Input
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        {state?.error && (
          <p className="rounded-[14px] border-l-[3px] border-white/25 bg-white/[0.06] py-2.5 pl-3 pr-3 text-[13px] leading-snug text-escuro">
            {state.error}
          </p>
        )}
        <SubmitButton />
      </form>

      <p className="text-center text-sm text-neutro-muted">
        Lembrou a senha?{" "}
        <Link href="/login" className="font-medium text-primary-forte">
          Entrar
        </Link>
      </p>
    </div>
  );
}
