"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/formatters";
import { useMountedTransition } from "@/hooks/useMountedTransition";
import { cn } from "@/lib/utils";

function formatarCentavos(centavos: number) {
  return formatCurrency(centavos / 100);
}

export function AjustarMetaModal({
  open,
  metaAtual,
  salvando,
  onSalvar,
  onFechar,
}: {
  open: boolean;
  metaAtual: number;
  salvando: boolean;
  onSalvar: (novoValor: number) => void;
  onFechar: () => void;
}) {
  const [centavos, setCentavos] = useState(() => Math.round(metaAtual * 100));
  const { rendered, visible } = useMountedTransition(open, 200);
  if (!rendered) return null;

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
          "w-full max-w-[400px] vidro rounded-t-[24px] p-6 transition-[transform,opacity] duration-250 ease-out motion-reduce:transition-opacity motion-reduce:duration-100 sm:rounded-card",
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 motion-reduce:translate-y-0",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-base font-semibold text-escuro">Ajustar meta mensal</p>
        <p className="mt-1 text-sm text-neutro-muted">
          Vale para o mês atual e passa a valer nos próximos, até você mudar de novo.
        </p>

        <input
          type="text"
          inputMode="numeric"
          autoFocus
          value={formatarCentavos(centavos)}
          onChange={(e) => {
            const digitos = e.target.value.replace(/\D/g, "");
            setCentavos(digitos ? Number(digitos) : 0);
          }}
          aria-label="Meta mensal"
          className="mt-4 w-full rounded-button border border-neutro-border bg-white/[0.04] px-4 py-3 text-center text-2xl font-semibold text-primary-forte outline-none focus:border-primary-forte"
        />

        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onFechar}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={salvando}
            onClick={() => onSalvar(centavos / 100)}
          >
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
