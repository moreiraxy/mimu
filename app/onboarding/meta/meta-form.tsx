"use client";

import { useMemo, useState, useTransition, type ChangeEvent } from "react";
import Link from "next/link";
import { concluirOnboarding } from "../actions";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { calcularMetaDiaria, formatCurrency } from "@/lib/formatters";

function formatarCentavos(centavos: number) {
  return formatCurrency(centavos / 100);
}

export function MetaForm({
  metaMensalAtual,
  clientesPorSemanaAtual,
}: {
  metaMensalAtual: number | null;
  clientesPorSemanaAtual: number | null;
}) {
  const [centavos, setCentavos] = useState(
    metaMensalAtual ? Math.round(metaMensalAtual * 100) : 0,
  );
  const [clientesPorSemana, setClientesPorSemana] = useState(
    clientesPorSemanaAtual ? String(clientesPorSemanaAtual) : "",
  );
  const [pending, startTransition] = useTransition();

  const metaMensal = centavos / 100;
  const metaDiaria = useMemo(
    () => (metaMensal > 0 ? calcularMetaDiaria(metaMensal) : null),
    [metaMensal],
  );

  function handleDigitar(event: ChangeEvent<HTMLInputElement>) {
    const somenteDigitos = event.target.value.replace(/\D/g, "");
    setCentavos(somenteDigitos ? Number(somenteDigitos) : 0);
  }

  function concluir(pularMeta: boolean) {
    startTransition(async () => {
      await concluirOnboarding({
        metaMensal: pularMeta ? null : metaMensal,
        clientesPorSemana: clientesPorSemana
          ? Number(clientesPorSemana)
          : null,
      });
    });
  }

  return (
    <div>
      <Link
        href="/onboarding/modulos"
        className="mb-4 inline-block text-[15px] text-neutro-muted"
      >
        ← Voltar
      </Link>
      <OnboardingProgress step={3} />
      <h1 className="text-center text-[24px] font-bold leading-tight tracking-tight text-escuro">
        Quanto você quer faturar por mês?
      </h1>
      <p className="mt-1 text-center text-[15px] text-neutro-muted">
        Não precisa ser exato. Pode ajustar depois.
      </p>

      <div className="mt-8 flex flex-col items-center">
        <input
          type="text"
          inputMode="numeric"
          value={formatarCentavos(centavos)}
          onChange={handleDigitar}
          aria-label="Meta mensal de faturamento"
          className="vidro-card w-full max-w-[280px] rounded-[20px] px-4 py-4 text-center text-[40px] font-bold leading-none tracking-tight text-primary-forte outline-none"
        />
        <p className="mt-3 min-h-[20px] text-center text-[13px] text-neutro-muted">
          {metaDiaria !== null
            ? `Para bater essa meta, você precisa de ${formatCurrency(metaDiaria)} por dia.`
            : " "}
        </p>
      </div>

      <div className="mt-6">
        <Input
          label="Quantos clientes você atende por semana em média?"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder="Ex.: 20"
          value={clientesPorSemana}
          onChange={(event) => setClientesPorSemana(event.target.value)}
        />
      </div>

      <Button
        type="button"
        className="mt-8 w-full"
        disabled={pending}
        onClick={() => concluir(false)}
      >
        {pending ? "Preparando tudo..." : "Começar agora"}
      </Button>

      <button
        type="button"
        onClick={() => concluir(true)}
        disabled={pending}
        className="mt-3 block w-full text-center text-[15px] text-neutro-muted disabled:opacity-50"
      >
        Pular por enquanto
      </button>
    </div>
  );
}
