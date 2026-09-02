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
        "vidro-card flex items-center gap-3 rounded-[20px] p-3.5",
        naoCompareceu && "opacity-60",
      )}
    >
      {concluido ? (
        // Concluído acende com a cor da marca, como todo "pronto" do app —
        // era o verde solto, que não existe em mais lugar nenhum.
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary-forte">
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
            "truncate text-[15px] text-escuro",
            naoCompareceu && "text-neutro-muted line-through",
          )}
        >
          {nome}
        </p>
        <p className="mt-0.5 text-[13px] text-neutro-muted">
          {formatTime(agendamento.data_hora)}
        </p>
      </div>

      {valor ? (
        <p
          className={cn(
            "flex-shrink-0 text-[15px] font-bold",
            naoCompareceu
              ? "text-neutro-muted line-through"
              : concluido
                ? "text-escuro"
                : "text-primary-forte",
          )}
        >
          {formatCurrency(valor)}
        </p>
      ) : null}
    </Link>
  );
}
