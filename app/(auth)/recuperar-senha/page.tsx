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
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-verde-light">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12 L9 17 L20 6"
              stroke="#2DBE8C"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-lg font-semibold text-escuro">Link enviado!</h1>
        <p className="text-sm text-neutro-muted">
          Confira seu e-mail para criar uma nova senha.
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
        <h1 className="text-xl font-semibold text-escuro">
          Esqueceu sua senha?
        </h1>
        <p className="mt-1 text-sm text-neutro-muted">
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
          <p className="rounded-button bg-erro-light px-3 py-2 text-sm text-erro">
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
