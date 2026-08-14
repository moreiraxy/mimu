"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signIn, type AuthFormState } from "../actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: AuthFormState = undefined;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export function LoginForm({
  confirmacaoPendente,
  senhaRedefinida,
}: {
  confirmacaoPendente: boolean;
  senhaRedefinida: boolean;
}) {
  const [state, formAction] = useFormState(signIn, initialState);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-escuro">
          Que bom te ver de novo
        </h1>
        <p className="mt-1 text-sm text-neutro-muted">
          Entre para continuar cuidando do seu negócio.
        </p>
      </div>

      {confirmacaoPendente && (
        <p className="rounded-button bg-verde-light px-3 py-2 text-sm text-verde-texto">
          Conta criada! Confira seu e-mail para confirmar antes de entrar.
        </p>
      )}
      {senhaRedefinida && (
        <p className="rounded-button bg-verde-light px-3 py-2 text-sm text-verde-texto">
          Senha atualizada. Entre com a sua nova senha.
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <Input
          label="E-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <Input
          label="Senha"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        {state?.error && (
          <p className="rounded-button bg-erro-light px-3 py-2 text-sm text-erro-texto">
            {state.error}
          </p>
        )}
        <SubmitButton />
      </form>

      <div className="flex items-center justify-between text-sm">
        <Link href="/recuperar-senha" className="font-medium text-primary-forte">
          Esqueci minha senha
        </Link>
        <Link href="/cadastro" className="text-neutro-muted">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
