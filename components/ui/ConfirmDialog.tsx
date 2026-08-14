"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useMountedTransition } from "@/hooks/useMountedTransition";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  // Quando vem preenchido, o botão de confirmar só libera depois que a pessoa
  // digitar exatamente este texto. É para ações sem volta: obriga a ler o que
  // está prestes a sumir, em vez de confirmar no automático.
  exigirTexto,
  exigirTextoRotulo,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  exigirTexto?: string;
  exigirTextoRotulo?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { rendered, visible } = useMountedTransition(open, 200);
  const [digitado, setDigitado] = useState("");

  // Zera ao fechar: reabrir o diálogo tem que começar do zero, senão a trava
  // já viria satisfeita da vez anterior.
  useEffect(() => {
    if (!open) setDigitado("");
  }, [open]);

  if (!rendered) return null;

  const liberado = !exigirTexto || digitado.trim() === exigirTexto.trim();

  return (
    <div
      className={cn(
        "fixed inset-0 z-[70] flex items-end justify-center bg-escuro/50 transition-opacity duration-200 sm:items-center",
        visible ? "opacity-100" : "opacity-0",
      )}
      onClick={onCancel}
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
        <p className="text-base font-semibold text-escuro">{title}</p>
        {description && (
          <p className="mt-1.5 text-sm text-neutro-muted">{description}</p>
        )}
        {exigirTexto && (
          <label className="mt-4 block">
            <span className="text-xs font-bold text-neutro-muted-strong">
              {exigirTextoRotulo ?? `Digite “${exigirTexto}” para confirmar`}
            </span>
            <input
              value={digitado}
              onChange={(e) => setDigitado(e.target.value)}
              autoComplete="off"
              className="mt-1.5 h-11 w-full rounded-xl border border-neutro-border bg-fundo px-3.5 text-sm text-escuro outline-none focus:border-erro"
            />
          </label>
        )}
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            className="flex-1 border-erro bg-erro text-white hover:bg-erro-dark"
            disabled={!liberado}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
