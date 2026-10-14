"use client";

import { useState } from "react";
import Link from "next/link";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { Skeleton } from "@/components/ui/Skeleton";
import { CalendarioInline } from "@/components/ui/CalendarioInline";
import { BackIcon } from "@/components/icons/NavIcons";
import { formatDataComDiaSemana } from "@/lib/formatters";
import { paraISOLocal } from "@/lib/utils";
import { GradeDeHorario } from "./GradeDeHorario";

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
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 sm:items-center"
          onClick={() => setSeletorAberto(false)}
        >
          <div
            className="w-full max-w-[430px] vidro rounded-t-[24px] p-5 sm:rounded-card"
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
      ) : (
        <>
          {/* A GRADE SUBSTITUIU A LISTA DE CARTÕES.
              Lista responde "o que tem hoje"; a pergunta dela é "às 15h estou
              livre?", e essa só a grade responde — porque nela o vazio tem
              altura. Tocar num espaço livre abre o formulário com data e hora
              já preenchidas. */}
          <GradeDeHorario dias={[dataObj]} agendamentos={agendamentos} />

          {agendamentos.length === 0 && (
            <p className="text-center text-[13px] text-neutro-muted">
              {ehHoje ? "Nada marcado hoje." : "Nada marcado nesse dia."} Toque
              num horário para marcar.
            </p>
          )}
        </>
      )}
    </div>
  );
}
