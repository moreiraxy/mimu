"use client";

import { Button } from "@/components/ui/Button";
import { useMountedTransition } from "@/hooks/useMountedTransition";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { rendered, visible } = useMountedTransition(open, 200);
  if (!rendered) return null;

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
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            className="flex-1 border-erro bg-erro text-white hover:bg-erro-dark"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
