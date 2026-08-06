"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ObservacoesCard({
  observacoes,
  onSalvar,
}: {
  observacoes: string | null;
  onSalvar: (texto: string) => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(observacoes ?? "");
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    await onSalvar(valor.trim());
    setSalvando(false);
    setEditando(false);
  }

  return (
    <div className="rounded-card border border-neutro-border bg-superficie p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-escuro">Observações</p>
        {!editando && (
          <button
            type="button"
            onClick={() => {
              setValor(observacoes ?? "");
              setEditando(true);
            }}
            className="text-xs font-semibold text-coral"
          >
            Editar
          </button>
        )}
      </div>

      {editando ? (
        <div className="mt-3 flex flex-col gap-3">
          <textarea
            value={valor}
            onChange={(event) => setValor(event.target.value)}
            rows={3}
            autoFocus
            className="resize-none rounded-button border border-neutro-border bg-fundo px-3.5 py-3 text-sm text-escuro outline-none transition-colors focus:border-coral focus:bg-superficie"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setEditando(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button className="flex-1" onClick={salvar} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-neutro-muted">
          {observacoes || "Nenhuma observação ainda."}
        </p>
      )}
    </div>
  );
}
