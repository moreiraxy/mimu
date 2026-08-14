"use client";

import { useMemo } from "react";
import { calcularFaturamentoPrevisto } from "@/lib/calculations";
import { formatCurrency } from "@/lib/formatters";
import { cn, paraISOLocal } from "@/lib/utils";
import { AgendamentoLinha } from "./AgendamentoLinha";
import type { AgendamentoComCliente, Transacao } from "@/types";

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function inicioDaSemana(referencia: Date): Date {
  const dia = new Date(referencia);
  const offset = (dia.getDay() + 6) % 7; // 0 = segunda
  dia.setDate(dia.getDate() - offset);
  dia.setHours(0, 0, 0, 0);
  return dia;
}

function formatarValorCompacto(valor: number): string {
  if (valor >= 1000) return `R$${(valor / 1000).toFixed(1)}k`;
  return `R$${Math.round(valor)}`;
}

export function VisaoSemana({
  transacoes,
  agendamentos,
}: {
  transacoes: Transacao[];
  agendamentos: AgendamentoComCliente[];
}) {
  const hojeISO = paraISOLocal(new Date());
  const inicioISO = useMemo(
    () => paraISOLocal(inicioDaSemana(new Date())),
    [],
  );

  const dias = useMemo(() => {
    const inicio = new Date(`${inicioISO}T00:00:00`);
    return Array.from({ length: 7 }, (_, i) => {
      const dia = new Date(inicio);
      dia.setDate(dia.getDate() + i);
      const iso = paraISOLocal(dia);

      const transacoesDoDia = transacoes.filter(
        (t) => t.data === iso && t.tipo === "entrada",
      );
      const agendamentosDoDia = agendamentos.filter(
        (a) => paraISOLocal(new Date(a.data_hora)) === iso,
      );

      return {
        iso,
        realizado: transacoesDoDia.reduce((s, t) => s + Number(t.valor), 0),
        previsto: calcularFaturamentoPrevisto(agendamentosDoDia),
        ehHoje: iso === hojeISO,
      };
    });
  }, [transacoes, agendamentos, inicioISO, hojeISO]);

  const fimISO = dias[6]!.iso;

  const realizadoSemana = dias.reduce((s, d) => s + d.realizado, 0);
  const previstoSemana = dias.reduce((s, d) => s + d.previsto, 0);
  const potencialSemana = realizadoSemana + previstoSemana;

  const maiorValor = Math.max(
    ...dias.map((d) => Math.max(d.realizado, d.previsto)),
    1,
  );

  const proximos = useMemo(() => {
    const agora = new Date();
    return agendamentos
      .filter((a) => {
        const iso = paraISOLocal(new Date(a.data_hora));
        return (
          new Date(a.data_hora) >= agora &&
          (a.status === "confirmado" || a.status === "pendente") &&
          iso >= inicioISO &&
          iso <= fimISO
        );
      })
      .sort(
        (a, b) =>
          new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime(),
      );
  }, [agendamentos, inicioISO, fimISO]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-card border border-neutro-border bg-superficie p-4">
        <div className="flex h-40 items-end justify-between gap-1.5">
          {dias.map((dia, i) => {
            const total = dia.realizado + dia.previsto;
            const alturaRealizado = (dia.realizado / maiorValor) * 100;
            const alturaPrevisto = (dia.previsto / maiorValor) * 100;

            return (
              <div
                key={dia.iso}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-card py-1",
                  dia.ehHoje && "bg-primary-light",
                )}
              >
                <span className="text-[9px] font-semibold text-neutro-muted">
                  {total > 0 ? formatarValorCompacto(total) : ""}
                </span>
                <div className="flex h-28 w-full items-end gap-0.5 px-0.5">
                  <div className="flex h-full flex-1 flex-col-reverse justify-start">
                    <div
                      className="w-full rounded-t-sm bg-verde"
                      style={{ height: `${alturaRealizado}%` }}
                    />
                  </div>
                  <div className="flex h-full flex-1 flex-col-reverse justify-start">
                    <div
                      className="w-full rounded-t-sm bg-primary/35"
                      style={{ height: `${alturaPrevisto}%` }}
                    />
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-semibold",
                    dia.ehHoje ? "text-primary-forte" : "text-neutro-muted",
                  )}
                >
                  {DIAS_SEMANA[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-neutro-muted">
        Realizado: {formatCurrency(realizadoSemana)} · Previsto:{" "}
        {formatCurrency(previstoSemana)} · Total potencial:{" "}
        {formatCurrency(potencialSemana)}
      </p>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-escuro">
          Próximos agendamentos
        </p>
        {proximos.length === 0 ? (
          <p className="py-4 text-center text-sm text-neutro-muted">
            Nenhum agendamento futuro essa semana.
          </p>
        ) : (
          proximos.map((agendamento) => (
            <AgendamentoLinha key={agendamento.id} agendamento={agendamento} />
          ))
        )}
      </div>
    </div>
  );
}
