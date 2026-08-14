import Link from "next/link";
import { CheckIcon } from "@/components/icons/NavIcons";
import { formatCurrency, formatTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { AgendamentoComCliente } from "@/types";

export function AgendamentoLinha({
  agendamento,
}: {
  agendamento: AgendamentoComCliente;
}) {
  const nome = agendamento.cliente?.nome ?? "Cliente";
  const valor = agendamento.valor_previsto;
  const naoCompareceu = agendamento.status === "nao_compareceu";
  const concluido = agendamento.status === "concluido";

  return (
    <Link
      href={`/agenda/${agendamento.id}`}
      className={cn(
        "flex items-center gap-3 rounded-card border border-neutro-border bg-superficie p-3",
        naoCompareceu && "opacity-60",
      )}
    >
      {concluido ? (
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-verde text-white">
          <CheckIcon size={12} />
        </span>
      ) : (
        <span
          className={cn(
            "h-2 w-2 flex-shrink-0 rounded-full",
            naoCompareceu ? "bg-neutro-icon" : "bg-primary",
          )}
        />
      )}

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm text-escuro",
            naoCompareceu && "text-neutro-muted line-through",
          )}
        >
          {nome}
        </p>
        <p className="text-xs text-neutro-muted">
          {formatTime(agendamento.data_hora)}
        </p>
      </div>

      {valor ? (
        <p
          className={cn(
            "flex-shrink-0 text-sm font-semibold",
            naoCompareceu
              ? "text-neutro-muted line-through"
              : concluido
                ? "text-verde-texto"
                : "text-primary-forte",
          )}
        >
          {formatCurrency(valor)}
        </p>
      ) : null}
    </Link>
  );
}
