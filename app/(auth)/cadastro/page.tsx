"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { signUp, type AuthFormState } from "../actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: AuthFormState = undefined;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Criando..." : "Criar minha conta"}
    </Button>
  );
}

export default function CadastroPage() {
  const [state, formAction] = useFormState(signUp, initialState);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-escuro">
          Vamos organizar seu negócio
        </h1>
        <p className="mt-1 text-sm text-neutro-muted">
          Leva menos de um minuto para começar.
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <Input
          label="Nome completo"
          name="nome_completo"
          autoComplete="name"
          required
        />
        <Input
          label="Nome do negócio"
          name="nome_negocio"
          placeholder="Ex.: Salão da Andréia"
          required
        />
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
          autoComplete="new-password"
          minLength={6}
          helper="Mínimo de 6 caracteres"
          required
        />
        {state?.error && (
          <p className="rounded-button bg-erro-light px-3 py-2 text-sm text-erro-texto">
            {state.error}
          </p>
        )}
        <SubmitButton />
      </form>

      <p className="text-center text-sm text-neutro-muted">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary-forte">
          Entrar
        </Link>
      </p>
    </div>
  );
}
