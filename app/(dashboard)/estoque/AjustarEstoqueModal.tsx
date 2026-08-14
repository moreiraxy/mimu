"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useMountedTransition } from "@/hooks/useMountedTransition";
import { cn } from "@/lib/utils";
import type { Produto } from "@/types";

type TipoAjuste = "entrada" | "ajuste";

export function AjustarEstoqueModal({
  open,
  produtos,
  salvando,
  onSalvar,
  onFechar,
}: {
  open: boolean;
  produtos: Produto[];
  salvando: boolean;
  onSalvar: (dados: {
    produtoId: string;
    tipo: TipoAjuste;
    quantidade: number;
    motivo: string;
  }) => void;
  onFechar: () => void;
}) {
  const [produtoId, setProdutoId] = useState(produtos[0]?.id ?? "");
  const [tipo, setTipo] = useState<TipoAjuste>("entrada");
  const [quantidade, setQuantidade] = useState("");
  const [motivo, setMotivo] = useState("");

  const { rendered, visible } = useMountedTransition(open, 200);
  if (!rendered) return null;

  const podeConfirmar = produtoId !== "" && Number(quantidade) > 0 && !salvando;

  function handleSalvar() {
    if (!podeConfirmar) return;
    onSalvar({ produtoId, tipo, quantidade: Number(quantidade), motivo: motivo.trim() });
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
          "w-full max-w-[420px] rounded-t-card bg-superficie p-6 transition-[transform,opacity] duration-250 ease-out motion-reduce:transition-opacity motion-reduce:duration-100 sm:rounded-card",
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 motion-reduce:translate-y-0",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-base font-semibold text-escuro">Ajustar estoque</p>
        <p className="mt-1 text-sm text-neutro-muted">
          Entrada manual soma ao estoque atual; correção define o valor exato.
        </p>

        <div className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-neutro-muted">Produto</span>
            <select
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              className="rounded-button border border-neutro-border bg-fundo px-3.5 py-3 text-base text-escuro outline-none focus:border-primary-forte md:text-sm"
            >
              {produtos.length === 0 && <option value="">Nenhum produto ativo</option>}
              {produtos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} · {p.quantidade_estoque} un.
                </option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            {(["entrada", "ajuste"] as const).map((opcao) => (
              <button
                key={opcao}
                type="button"
                onClick={() => setTipo(opcao)}
                className={cn(
                  "flex-1 rounded-button border py-2.5 text-sm font-semibold transition-colors",
                  tipo === opcao
                    ? "border-primary-forte bg-primary-light text-primary-forte"
                    : "border-neutro-border text-neutro-muted-strong",
                )}
              >
                {opcao === "entrada" ? "Entrada manual" : "Correção"}
              </button>
            ))}
          </div>

          <Input
            label={tipo === "entrada" ? "Quantidade a somar" : "Quantidade correta em estoque"}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
          />

          <Input
            label="Motivo (opcional)"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: reposição, contagem, perda"
          />
        </div>

        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onFechar}>
            Cancelar
          </Button>
          <Button className="flex-1" disabled={!podeConfirmar} onClick={handleSalvar}>
            {salvando ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
