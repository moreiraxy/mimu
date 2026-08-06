import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { formatCurrency, formatTime } from "@/lib/formatters";
import { STATUS_CONFIG } from "./status";
import type { AgendamentoComCliente } from "@/types";

export function AgendamentoCard({
  agendamento,
}: {
  agendamento: AgendamentoComCliente;
}) {
  const config = STATUS_CONFIG[agendamento.status];

  return (
    <Link
      href={`/agenda/${agendamento.id}`}
      className="flex items-center gap-3 rounded-card border border-neutro-border bg-superficie p-3"
    >
      <p className="w-12 flex-shrink-0 text-sm font-semibold text-escuro">
        {formatTime(agendamento.data_hora)}
      </p>
      <Avatar nome={agendamento.cliente?.nome ?? "?"} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-escuro">
          {agendamento.cliente?.nome ?? "Sem cliente"}
        </p>
        <p className="truncate text-xs text-neutro-muted">
          {agendamento.titulo}
        </p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-1">
        {agendamento.valor_previsto ? (
          <p className="text-sm font-semibold text-escuro">
            {formatCurrency(agendamento.valor_previsto)}
          </p>
        ) : null}
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.corBg} ${config.corTexto}`}
        >
          {config.label}
        </span>
      </div>
    </Link>
  );
}
