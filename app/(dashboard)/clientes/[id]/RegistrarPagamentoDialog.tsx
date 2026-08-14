"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/formatters";
import { useMountedTransition } from "@/hooks/useMountedTransition";
import { cn } from "@/lib/utils";

export function RegistrarPagamentoDialog({
  open,
  saldoAtual,
  onConfirmar,
  onFechar,
}: {
  open: boolean;
  saldoAtual: number;
  onConfirmar: (valor: number) => Promise<void>;
  onFechar: () => void;
}) {
  const [centavos, setCentavos] = useState(Math.round(saldoAtual * 100));
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) setCentavos(Math.round(saldoAtual * 100));
  }, [open, saldoAtual]);

  const { rendered, visible } = useMountedTransition(open, 200);
  if (!rendered) return null;

  async function confirmar() {
    setEnviando(true);
    await onConfirmar(centavos / 100);
    setEnviando(false);
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-end justify-center bg-escuro/50 transition-opacity duration-200 sm:items-center",
        visible ? "opacity-100" : "opacity-0",
      )}
      onClick={onFechar}
    >
      <div
        className={cn(
          "w-full max-w-[430px] rounded-t-card bg-superficie p-6 transition-[transform,opacity] duration-250 ease-out motion-reduce:transition-opacity motion-reduce:duration-100 sm:rounded-card",
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 motion-reduce:translate-y-0",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-base font-semibold text-escuro">
          Registrar pagamento
        </p>
        <p className="mt-1 text-sm text-neutro-muted">
          Saldo em aberto: {formatCurrency(saldoAtual)}
        </p>

        <div className="mt-4 flex justify-center">
          <input
            type="text"
            inputMode="numeric"
            value={formatCurrency(centavos / 100)}
            onChange={(event) => {
              const digitos = event.target.value.replace(/\D/g, "");
              setCentavos(digitos ? Number(digitos) : 0);
            }}
            aria-label="Valor pago"
            className="w-full max-w-[220px] rounded-button border border-neutro-border bg-superficie px-4 py-3 text-center text-2xl font-semibold text-primary-forte outline-none focus:border-primary-forte"
          />
        </div>

        <Button
          className="mt-6 w-full"
          disabled={centavos <= 0 || enviando}
          onClick={confirmar}
        >
          {enviando ? "Confirmando..." : "Confirmar pagamento"}
        </Button>
      </div>
    </div>
  );
}
