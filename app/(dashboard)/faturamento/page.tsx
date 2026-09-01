"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFaturamento } from "@/hooks/useFaturamento";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { VisaoHoje } from "./VisaoHoje";
import { VisaoSemana } from "./VisaoSemana";
import { VisaoMes } from "./VisaoMes";

const VISOES = [
  { valor: "hoje", label: "Hoje" },
  { valor: "semana", label: "Semana" },
  { valor: "mes", label: "Mês" },
] as const;

type Visao = (typeof VISOES)[number]["valor"];

export default function FaturamentoPage() {
  const { empresa } = useAuth();
  const { transacoes, agendamentos, loading, error, refetch } = useFaturamento();
  const [visao, setVisao] = useState<Visao>("hoje");

  return (
    <div className="lg:mx-auto lg:max-w-3xl">
      <PageHeader title="Faturamento Previsto" />

      <div className="mb-4 flex justify-center">
        <div className="flex gap-1 rounded-full bg-fundo p-0.5">
          {VISOES.map((opcao) => (
            <button
              key={opcao.valor}
              type="button"
              onClick={() => setVisao(opcao.valor)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold",
                visao === opcao.valor
                  ? "bg-escuro text-fundo"
                  : "text-neutro-muted",
              )}
            >
              {opcao.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <FaturamentoSkeleton />
      ) : error ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-neutro-muted">{error}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-sm font-semibold text-primary-forte"
          >
            Tentar de novo
          </button>
        </div>
      ) : (
        <>
          {visao === "hoje" && (
            <VisaoHoje transacoes={transacoes} agendamentos={agendamentos} />
          )}
          {visao === "semana" && (
            <VisaoSemana transacoes={transacoes} agendamentos={agendamentos} />
          )}
          {visao === "mes" && (
            <VisaoMes
              transacoes={transacoes}
              agendamentos={agendamentos}
              metaMensal={empresa?.meta_mensal ?? 0}
            />
          )}
        </>
      )}
    </div>
  );
}

function FaturamentoSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-card" />
        <Skeleton className="h-20 rounded-card" />
      </div>
      <Skeleton className="h-16 w-full rounded-card" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-14 w-full rounded-card" />
        <Skeleton className="h-14 w-full rounded-card" />
        <Skeleton className="h-14 w-full rounded-card" />
      </div>
    </div>
  );
}
