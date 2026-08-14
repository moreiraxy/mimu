"use client";

import { useMemo } from "react";
import { cn, paraISOLocal } from "@/lib/utils";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { Skeleton } from "@/components/ui/Skeleton";
import { STATUS_CONFIG } from "./status";

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function inicioDaSemana(referencia: Date): Date {
  const dia = new Date(referencia);
  const offset = (dia.getDay() + 6) % 7; // 0 = segunda
  dia.setDate(dia.getDate() - offset);
  dia.setHours(0, 0, 0, 0);
  return dia;
}

export function SemanaView({
  dataReferencia,
  onSelecionarDia,
}: {
  dataReferencia: string;
  onSelecionarDia: (dataISO: string) => void;
}) {
  const inicio = inicioDaSemana(new Date(`${dataReferencia}T00:00:00`));
  const inicioISO = paraISOLocal(inicio);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  const fimISO = paraISOLocal(fim);

  const { agendamentos, loading } = useAgendamentos(inicioISO, fimISO);
  const hojeISO = paraISOLocal(new Date());

  const dias = useMemo(() => {
    const inicioDoRange = new Date(`${inicioISO}T00:00:00`);
    return Array.from({ length: 7 }, (_, i) => {
      const dia = new Date(inicioDoRange);
      dia.setDate(dia.getDate() + i);
      const iso = paraISOLocal(dia);
      const doDia = agendamentos.filter(
        (a) => paraISOLocal(new Date(a.data_hora)) === iso,
      );
      return { iso, numero: dia.getDate(), agendamentos: doDia };
    });
  }, [inicioISO, agendamentos]);

  if (loading) {
    return <Skeleton className="h-40 w-full rounded-card" />;
  }

  return (
    <div className="grid grid-cols-7 gap-1">
      {dias.map((dia, i) => {
        const ehHoje = dia.iso === hojeISO;
        return (
          <button
            key={dia.iso}
            type="button"
            onClick={() => onSelecionarDia(dia.iso)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-card p-1.5",
              ehHoje ? "bg-primary-light" : "bg-superficie border border-neutro-border",
            )}
          >
            <span className="text-[9px] font-semibold text-neutro-muted">
              {DIAS_SEMANA[i]}
            </span>
            <span
              className={cn(
                "text-xs font-semibold",
                ehHoje ? "text-primary-forte" : "text-escuro",
              )}
            >
              {dia.numero}
            </span>
            <div className="flex min-h-[16px] flex-col items-center gap-0.5">
              {dia.agendamentos.slice(0, 4).map((a) => (
                <span
                  key={a.id}
                  className={cn(
                    "h-1.5 w-5 rounded-full",
                    STATUS_CONFIG[a.status].corPonto,
                  )}
                />
              ))}
              {dia.agendamentos.length > 4 && (
                <span className="text-[8px] text-neutro-muted">
                  +{dia.agendamentos.length - 4}
                </span>
              )}
            </div>
            <span className="text-[9px] text-neutro-muted">
              {dia.agendamentos.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}
