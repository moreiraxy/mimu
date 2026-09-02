"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useMountedTransition } from "@/hooks/useMountedTransition";
import { FORMAS_PAGAMENTO } from "@/lib/formasPagamento";
import type { FormaPagamento } from "@/types";

export function ConcluirBottomSheet({
  open,
  valorInicial,
  onConfirmar,
  onFechar,
}: {
  open: boolean;
  valorInicial: number | null;
  onConfirmar: (
    valor: number,
    formaPagamento: FormaPagamento | null,
  ) => Promise<void>;
  onFechar: () => void;
}) {
  const [centavos, setCentavos] = useState(
    Math.round((valorInicial ?? 0) * 100),
  );
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | null>(
    null,
  );
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (open) setCentavos(Math.round((valorInicial ?? 0) * 100));
  }, [open, valorInicial]);

  const { rendered, visible } = useMountedTransition(open, 200);
  if (!rendered) return null;

  async function confirmar() {
    setEnviando(true);
    await onConfirmar(centavos / 100, formaPagamento);
    setEnviando(false);
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-end justify-center bg-black/65 transition-opacity duration-200 sm:items-center",
        visible ? "opacity-100" : "opacity-0",
      )}
      onClick={onFechar}
    >
      <div
        className={cn(
          "w-full max-w-[430px] vidro rounded-t-[28px] p-6 transition-[transform,opacity] duration-250 ease-out motion-reduce:transition-opacity motion-reduce:duration-100 sm:rounded-card",
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 motion-reduce:translate-y-0",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[20px] font-bold leading-tight tracking-tight text-escuro">
          Confirmar recebimento
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
            aria-label="Valor recebido"
            className="vidro-card w-full max-w-[260px] rounded-[20px] px-4 py-4 text-center text-[40px] font-bold leading-none tracking-tight text-primary-forte outline-none"
          />
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[13px] text-neutro-muted">
            Forma de pagamento
          </p>
          <div className="flex flex-wrap gap-2">
            {FORMAS_PAGAMENTO.map((forma) => (
              <button
                key={forma.valor}
                type="button"
                onClick={() => setFormaPagamento(forma.valor)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                  formaPagamento === forma.valor
                    ? "bg-primary/20 text-primary-forte"
                    : "vidro-card text-escuro",
                )}
              >
                {forma.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          className="mt-6 w-full"
          disabled={centavos <= 0 || enviando}
          onClick={confirmar}
        >
          {enviando ? "Confirmando..." : "Confirmar recebimento"}
        </Button>
      </div>
    </div>
  );
}
