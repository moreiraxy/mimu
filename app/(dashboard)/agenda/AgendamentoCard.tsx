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
      className="vidro-card flex items-center gap-3 rounded-[20px] p-3.5"
    >
      <p className="w-12 flex-shrink-0 text-[15px] font-bold text-escuro">
        {formatTime(agendamento.data_hora)}
      </p>
      <Avatar nome={agendamento.cliente?.nome ?? "?"} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] text-escuro">
          {agendamento.cliente?.nome ?? "Sem cliente"}
        </p>
        <p className="mt-0.5 truncate text-[13px] text-neutro-muted">
          {agendamento.titulo}
        </p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-1">
        {agendamento.valor_previsto ? (
          <p className="text-[15px] font-bold text-escuro">
            {formatCurrency(agendamento.valor_previsto)}
          </p>
        ) : null}
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${config.corBg} ${config.corTexto}`}
        >
          {config.label}
        </span>
      </div>
    </Link>
  );
}
