import { useMemo } from "react";
import { calcularFaturamentoPrevisto } from "@/lib/calculations";
import { formatCurrency } from "@/lib/formatters";
import { paraISOLocal } from "@/lib/utils";
import { AgendamentoLinha } from "./AgendamentoLinha";
import type { AgendamentoComCliente, Transacao } from "@/types";

export function VisaoHoje({
  transacoes,
  agendamentos,
}: {
  transacoes: Transacao[];
  agendamentos: AgendamentoComCliente[];
}) {
  const hojeISO = paraISOLocal(new Date());

  const { realizado, previsto, agendamentosHoje } = useMemo(() => {
    const transacoesHoje = transacoes.filter(
      (t) => t.data === hojeISO && t.tipo === "entrada",
    );
    const agendamentosHoje = agendamentos.filter(
      (a) => paraISOLocal(new Date(a.data_hora)) === hojeISO,
    );

    return {
      realizado: transacoesHoje.reduce((total, t) => total + Number(t.valor), 0),
      previsto: calcularFaturamentoPrevisto(agendamentosHoje),
      agendamentosHoje,
    };
  }, [transacoes, agendamentos, hojeISO]);

  const potencial = realizado + previsto;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-card border-2 border-verde bg-superficie p-4">
          <p className="text-xs text-neutro-muted">Realizado</p>
          <p className="mt-1 text-xl font-bold text-verde-texto">
            {formatCurrency(realizado)}
          </p>
        </div>
        <div className="rounded-card border-2 border-dashed border-primary-forte bg-superficie p-4">
          <p className="text-xs text-neutro-muted">Previsto</p>
          <p className="mt-1 text-xl font-bold text-primary-forte">
            {formatCurrency(previsto)}
          </p>
        </div>
      </div>

      <div className="rounded-card bg-escuro p-4 text-center">
        <p className="text-xs text-white/70">Potencial total do dia</p>
        <p className="mt-1 text-2xl font-bold text-white">
          {formatCurrency(potencial)}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {agendamentosHoje.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutro-muted">
            Nenhum agendamento hoje.
          </p>
        ) : (
          agendamentosHoje.map((agendamento) => (
            <AgendamentoLinha key={agendamento.id} agendamento={agendamento} />
          ))
        )}
      </div>
    </div>
  );
}
