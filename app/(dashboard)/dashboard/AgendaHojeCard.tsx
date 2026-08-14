"use client";

import Link from "next/link";
import { formatCurrency, formatTime } from "@/lib/formatters";
import type { AgendamentoComCliente, StatusAgendamento } from "@/types";

const COR_STATUS: Record<StatusAgendamento, string> = {
  confirmado: "bg-verde",
  pendente: "bg-ambar",
  concluido: "bg-neutro-icon",
  nao_compareceu: "bg-erro",
};

export function AgendaHojeCard({
  agendamentos,
}: {
  agendamentos: AgendamentoComCliente[];
}) {
  const visiveis = agendamentos.slice(0, 3);

  return (
    <div className="rounded-card border border-neutro-border bg-superficie p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-escuro">Agenda de hoje</p>
        <Link href="/agenda" className="text-xs font-semibold text-primary-forte">
          Ver tudo →
        </Link>
      </div>

      {visiveis.length === 0 ? (
        <Link href="/agenda" className="mt-3 block text-sm text-neutro-muted">
          Nenhum agendamento hoje. Criar agendamento →
        </Link>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {visiveis.map((agendamento) => (
            <div key={agendamento.id} className="flex items-center gap-2.5">
              <span
                className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${COR_STATUS[agendamento.status]}`}
              />
              <p className="flex-1 truncate text-sm text-escuro">
                {agendamento.cliente?.nome ?? "Cliente"} ·{" "}
                {agendamento.titulo}
              </p>
              <p className="flex-shrink-0 text-xs text-neutro-muted">
                {formatTime(agendamento.data_hora)}
                {agendamento.valor_previsto
                  ? ` · ${formatCurrency(agendamento.valor_previsto)}`
                  : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
