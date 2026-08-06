import Link from "next/link";
import { Star } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { formatCurrency, formatRelativeDate } from "@/lib/formatters";
import type { Cliente } from "@/types";

export function ClienteListItem({ cliente }: { cliente: Cliente }) {
  return (
    <Link
      href={`/clientes/${cliente.id}`}
      className="flex items-center gap-3 rounded-card border border-neutro-border bg-superficie p-3"
    >
      <Avatar nome={cliente.nome} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium text-escuro">
            {cliente.nome}
          </p>
          {cliente.cliente_fiel && (
            <span className="flex flex-shrink-0 items-center gap-0.5 rounded-full bg-ambar-soft px-1.5 py-0.5 text-[10px] font-semibold text-ambar-text">
              <Star className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
              Fiel
            </span>
          )}
        </div>
        <p className="text-xs text-neutro-muted">
          {cliente.ultimo_atendimento
            ? formatRelativeDate(cliente.ultimo_atendimento)
            : "Sem atendimentos ainda"}
        </p>
      </div>
      <p className="flex-shrink-0 text-sm font-semibold text-escuro">
        {formatCurrency(cliente.total_gasto)}
      </p>
    </Link>
  );
}
