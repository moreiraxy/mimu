"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFaturamento } from "@/hooks/useFaturamento";
import { PageHeader } from "@/components/PageHeader";
import { SeletorSegmentado } from "@/components/SeletorSegmentado";
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

      {/* O mesmo seletor de recorte do resto do app. Era `bg-escuro` no item
          aceso — no tema escuro, um retângulo branco chapado. */}
      <SeletorSegmentado
        opcoes={VISOES.map((o) => ({ id: o.valor, label: o.label }))}
        valor={visao}
        onChange={setVisao}
        className="mb-4"
      />

      {loading ? (
        <FaturamentoSkeleton />
      ) : error ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-[15px] text-neutro-muted">{error}</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="text-[15px] font-bold text-primary-forte"
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
        <Skeleton className="h-20 rounded-[20px]" />
        <Skeleton className="h-20 rounded-[20px]" />
      </div>
      <Skeleton className="h-16 w-full rounded-[20px]" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-14 w-full rounded-[20px]" />
        <Skeleton className="h-14 w-full rounded-[20px]" />
        <Skeleton className="h-14 w-full rounded-[20px]" />
      </div>
    </div>
  );
}
