import { formatCurrency } from "@/lib/formatters";

export function SaldoHeader({ saldo }: { saldo: number }) {
  const positivo = saldo >= 0;

  return (
    <div className="flex flex-col items-center gap-1 py-2 text-center">
      <p className="text-xs text-neutro-muted">Saldo em caixa</p>
      <p
        className={`text-3xl font-bold ${positivo ? "text-verde" : "text-erro"}`}
      >
        {formatCurrency(saldo)}
      </p>
    </div>
  );
}
