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
        /*
          `bg-black/65`, e NUNCA `bg-escuro/50`.

          `escuro` é o token do TEXTO, e ele inverte com o tema: no tema escuro
          vale branco. Como véu de modal, isso não escurecia a tela — clareava.
          A página inteira ficava leitosa atrás da folha, e a folha de vidro por
          cima de um branco a 50% virava uma massa cinza sem contraste nenhum.
          Preto é preto nos dois temas, que é exatamente o que um véu precisa
          ser.

          65% e não 40%: as folhas são de VIDRO e deixam passar o que está
          atrás. O escurecimento é o que devolve a leitura do que está na
          frente.
        */
        "fixed inset-0 z-[70] flex items-end justify-center bg-black/65 transition-opacity duration-200 sm:items-center",
        visible ? "opacity-100" : "opacity-0",
      )}
      onClick={onCancel}
    >
      <div
        className={cn(
          "w-full max-w-[430px] vidro rounded-t-[24px] p-6 transition-[transform,opacity] duration-250 ease-out motion-reduce:transition-opacity motion-reduce:duration-100 sm:rounded-card",
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
              className="mt-1.5 h-11 w-full rounded-xl border border-neutro-border bg-white/[0.04] px-3.5 text-sm text-escuro outline-none focus:border-erro"
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
