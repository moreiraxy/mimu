import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { TransacaoItem } from "./TransacaoItem";
import type { TransacaoComCliente } from "@/types";

export function ListaTransacoes({
  grupos,
  onExcluir,
}: {
  grupos: [string, TransacaoComCliente[]][];
  onExcluir: (id: string) => void;
}) {
  if (grupos.length === 0) {
    return (
      <div className="rounded-card border border-dashed border-neutro-border p-6 text-center">
        <p className="text-sm text-neutro-muted">
          Nenhuma transação por aqui ainda.
        </p>
        <Link
          href="/financeiro/nova-entrada"
          className="mt-3 inline-block text-sm font-semibold text-coral"
        >
          + Registrar a primeira
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {grupos.map(([data, itens]) => (
        <div key={data}>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-neutro-muted">
              {formatDate(data)}
            </p>
            <TotalDoDia itens={itens} />
          </div>
          <div className="flex flex-col gap-2">
            {itens.map((transacao) => (
              <TransacaoItem
                key={transacao.id}
                transacao={transacao}
                onExcluir={() => onExcluir(transacao.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TotalDoDia({ itens }: { itens: TransacaoComCliente[] }) {
  const total = itens.reduce(
    (soma, t) => soma + (t.tipo === "entrada" ? Number(t.valor) : -Number(t.valor)),
    0,
  );
  const positivo = total >= 0;

  return (
    <p
      className={`text-xs font-semibold ${positivo ? "text-verde-dark" : "text-erro"}`}
    >
      {positivo ? "+" : ""}
      {formatCurrency(total)}
    </p>
  );
}
