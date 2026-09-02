"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { signUp, type AuthFormState } from "../actions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { BotoesSociais } from "@/components/auth/BotoesSociais";
import { PLANOS, planoValido } from "@/lib/planos";

const initialState: AuthFormState = undefined;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Criando..." : "Criar minha conta"}
    </Button>
  );
}

function FormularioCadastro() {
  const [state, formAction] = useFormState(signUp, initialState);
  // Plano escolhido lá na landing. Vem por query e segue num campo oculto —
  // é o que decide, no fim do onboarding, entre ganhar os 7 dias de teste ou
  // ir direto pro pagamento. Quem chega aqui sem plano nenhum é tratado como
  // quem escolheu o grátis. A validação de verdade é no servidor.
  const planoBruto = useSearchParams().get("plano") ?? "";
  const plano = planoValido(planoBruto);
  const escolhido = plano ? PLANOS[plano] : null;

  return (
    <div className="flex flex-col gap-6">
      {/*
        Quem clicou num plano pago precisa ver que a escolha veio junto. Sem
        isto a tela era a mesma para todo mundo, e o clique em "Seja Pro"
        parecia ter sido ignorado: a pessoa caía num cadastro genérico sem
        nenhuma menção ao plano nem ao pagamento.

        A conta vem antes do pagamento de propósito. A assinatura é de alguém,
        e o Mercado Pago precisa de um e-mail e de uma referência para avisar
        quando o pagamento cai. Cobrar antes de existir conta deixaria
        pagamento sem dono se a pessoa fechasse a aba no meio.
      */}
      {escolhido ? (
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-xs font-bold text-primary-forte">
            Plano {escolhido.nome} · R$ {escolhido.valorMensal}/mês
          </span>
          <h1 className="mt-3 text-[24px] font-bold leading-tight tracking-tight text-escuro">
            Crie sua conta para assinar
          </h1>
          <p className="mt-1 text-[15px] text-neutro-muted">
            É o próximo passo: assim que a conta estiver pronta, você vai para
            o pagamento.
          </p>
        </div>
      ) : (
        <div>
          <h1 className="text-[24px] font-bold leading-tight tracking-tight text-escuro">
            Vamos organizar seu negócio
          </h1>
          <p className="mt-1 text-[15px] text-neutro-muted">
            Leva menos de um minuto para começar.
          </p>
        </div>
      )}

      {/* Desligado hoje — ver lib/login-social.ts. Fica aqui para o dia de
          ligar ser um lugar só, e não dois. */}
      <BotoesSociais plano={plano ?? ""} />

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="plano" value={plano ?? ""} />
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
          <p className="rounded-[14px] border-l-[3px] border-escuro/25 bg-escuro/[0.06] py-2.5 pl-3 pr-3 text-[13px] leading-snug text-escuro">
            {state.error}
          </p>
        )}
        <SubmitButton />
      </form>

      <p className="text-center text-sm text-neutro-muted">
        Já tem conta?{" "}
        {/* Leva o plano junto: sem isto, quem já tem conta clicava em
            "Entrar", logava e caía no dashboard, e a escolha de plano
            simplesmente sumia no caminho. */}
        <Link
          href={plano ? `/login?plano=${plano}` : "/login"}
          className="font-medium text-primary-forte"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}

/**
 * `useSearchParams` obriga a página a ser dinâmica, a não ser que fique
 * dentro de um limite de Suspense. Envolver só o formulário deixa o resto da
 * tela ser gerado na build: sem isto o build falha ao pré-renderizar
 * /cadastro.
 */
export default function CadastroPage() {
  return (
    <Suspense fallback={null}>
      <FormularioCadastro />
    </Suspense>
  );
}
