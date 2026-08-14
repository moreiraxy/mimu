"use client";

import { useState } from "react";
import Link from "next/link";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { Skeleton } from "@/components/ui/Skeleton";
import { CalendarioInline } from "@/components/ui/CalendarioInline";
import { BackIcon } from "@/components/icons/NavIcons";
import { formatDataComDiaSemana } from "@/lib/formatters";
import { paraISOLocal } from "@/lib/utils";
import { AgendamentoCard } from "./AgendamentoCard";

export function DiaView({
  data,
  onMudarData,
}: {
  data: string;
  onMudarData: (dataISO: string) => void;
}) {
  const { agendamentos, loading, error, refetch } = useAgendamentos(data, data);
  const [seletorAberto, setSeletorAberto] = useState(false);

  const dataObj = new Date(`${data}T00:00:00`);
  const ehHoje = data === paraISOLocal(new Date());

  function irPara(delta: number) {
    const nova = new Date(dataObj);
    nova.setDate(nova.getDate() + delta);
    onMudarData(paraISOLocal(nova));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Dia anterior"
          onClick={() => irPara(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-escuro hover:bg-neutro-disabled"
        >
          <BackIcon />
        </button>
        <button
          type="button"
          onClick={() => setSeletorAberto(true)}
          className="text-sm font-semibold text-escuro"
        >
          {ehHoje ? "Hoje" : formatDataComDiaSemana(dataObj)}
        </button>
        <button
          type="button"
          aria-label="Próximo dia"
          onClick={() => irPara(1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-escuro hover:bg-neutro-disabled"
        >
          <BackIcon className="rotate-180" />
        </button>
      </div>

      {seletorAberto && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-escuro/50 sm:items-center"
          onClick={() => setSeletorAberto(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-card bg-superficie p-5 sm:rounded-card"
            onClick={(event) => event.stopPropagation()}
          >
            <CalendarioInline
              value={data}
              onChange={(iso) => {
                onMudarData(iso);
                setSeletorAberto(false);
              }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full rounded-card" />
          <Skeleton className="h-16 w-full rounded-card" />
          <Skeleton className="h-16 w-full rounded-card" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-sm text-neutro-muted">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="text-sm font-semibold text-primary-forte"
          >
            Tentar de novo
          </button>
        </div>
      ) : agendamentos.length === 0 ? (
        <div className="rounded-card border border-dashed border-neutro-border p-6 text-center">
          <p className="text-sm text-neutro-muted">
            {ehHoje
              ? "Nenhum agendamento hoje."
              : "Nenhum agendamento nesse dia."}{" "}
            Que tal criar um?
          </p>
          <Link
            href="/agenda/novo"
            className="mt-2 inline-block text-sm font-semibold text-primary-forte"
          >
            Criar agendamento →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {agendamentos.map((agendamento) => (
            <AgendamentoCard key={agendamento.id} agendamento={agendamento} />
          ))}
        </div>
      )}
    </div>
  );
}
