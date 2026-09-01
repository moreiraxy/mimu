"use client";

import { useMemo } from "react";
import { cn, paraISOLocal } from "@/lib/utils";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDataComDiaSemana } from "@/lib/formatters";
import { AgendamentoCard } from "./AgendamentoCard";
import { STATUS_CONFIG } from "./status";

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function inicioDaSemana(referencia: Date): Date {
  const dia = new Date(referencia);
  const offset = (dia.getDay() + 6) % 7; // 0 = segunda
  dia.setDate(dia.getDate() - offset);
  dia.setHours(0, 0, 0, 0);
  return dia;
}

/**
 * A semana inteira: a fita dos sete dias em cima e o que existe neles embaixo.
 *
 * ERA SÓ A FITA, com 40px de altura, número em 12px e rótulo em 9px — sete
 * caixinhas apertadas no alto de uma tela vazia. Toda a informação da semana
 * cabia em três pixels de bolinha, e para saber o que havia numa quarta-feira
 * era preciso tocar nela e trocar de visão.
 *
 * A fita agora é legível de longe, e o resto da altura — que sobrava — mostra
 * os agendamentos da semana agrupados por dia. É a diferença entre um seletor
 * de data e uma agenda: quem abre a semana quer VER a semana.
 */
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
      const doDia = agendamentos
        .filter((a) => paraISOLocal(new Date(a.data_hora)) === iso)
        .sort(
          (a, b) =>
            new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime(),
        );
      return { iso, numero: dia.getDate(), agendamentos: doDia };
    });
  }, [inicioISO, agendamentos]);

  if (loading) {
    return <Skeleton className="h-40 w-full rounded-[20px]" />;
  }

  const comAgendamentos = dias.filter((d) => d.agendamentos.length > 0);

  return (
    <div className="flex flex-col gap-4">
      {/* `gap-1.5` e não `gap-1`: com as colunas mais altas, o vão de 4px
          fazia as sete lerem como um bloco único em vez de sete dias. */}
      <div className="grid grid-cols-7 gap-1.5">
        {dias.map((dia, i) => {
          const ehHoje = dia.iso === hojeISO;
          return (
            <button
              key={dia.iso}
              type="button"
              onClick={() => onSelecionarDia(dia.iso)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-[16px] px-1 py-3",
                ehHoje ? "bg-primary/20" : "vidro-card",
              )}
            >
              <span
                className={cn(
                  "text-[12px] font-semibold",
                  ehHoje ? "text-primary-forte" : "text-neutro-muted",
                )}
              >
                {DIAS_SEMANA[i]}
              </span>
              <span
                className={cn(
                  "text-[22px] font-bold leading-none tracking-tight",
                  ehHoje ? "text-primary-forte" : "text-escuro",
                )}
              >
                {dia.numero}
              </span>

              {/* Altura fixa para as sete colunas terminarem na mesma linha
                  mesmo com dias vazios — sem isso a fita fica serrilhada. */}
              <div className="flex h-[14px] items-center justify-center gap-[3px]">
                {dia.agendamentos.slice(0, 3).map((a) => (
                  <span
                    key={a.id}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      STATUS_CONFIG[a.status].corPonto,
                    )}
                  />
                ))}
                {dia.agendamentos.length > 3 && (
                  <span className="text-[10px] leading-none text-neutro-muted">
                    +{dia.agendamentos.length - 3}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {comAgendamentos.length === 0 ? (
        <div className="vidro-card rounded-[20px] p-6 text-center">
          <p className="text-[15px] text-neutro-muted">
            Nenhum agendamento nesta semana.
          </p>
        </div>
      ) : (
        comAgendamentos.map((dia) => (
          <div key={dia.iso}>
            <button
              type="button"
              onClick={() => onSelecionarDia(dia.iso)}
              className="mb-2 flex w-full items-baseline justify-between gap-3 px-1 text-left"
            >
              <span className="truncate text-[13px] font-semibold text-neutro-muted">
                {dia.iso === hojeISO
                  ? "Hoje"
                  : formatDataComDiaSemana(new Date(`${dia.iso}T00:00:00`))}
              </span>
              <span className="flex-shrink-0 text-[13px] font-bold text-escuro">
                {dia.agendamentos.length}
              </span>
            </button>
            <div className="flex flex-col gap-2">
              {dia.agendamentos.map((agendamento) => (
                <AgendamentoCard
                  key={agendamento.id}
                  agendamento={agendamento}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
