"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatarTelefoneBR } from "@/lib/formatters";
import { useMountedTransition } from "@/hooks/useMountedTransition";
import { cn } from "@/lib/utils";

export function NovoFornecedorModal({
  open,
  salvando,
  onSalvar,
  onFechar,
}: {
  open: boolean;
  salvando: boolean;
  onSalvar: (dados: { nome: string; telefone: string; email: string }) => void;
  onFechar: () => void;
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");

  const { rendered, visible } = useMountedTransition(open, 200);
  if (!rendered) return null;

  const podeConfirmar = nome.trim() !== "" && !salvando;

  function handleSalvar() {
    if (!podeConfirmar) return;
    onSalvar({ nome: nome.trim(), telefone: telefone.trim(), email: email.trim() });
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
          "w-full max-w-[420px] vidro rounded-t-[24px] p-6 transition-[transform,opacity] duration-250 ease-out motion-reduce:transition-opacity motion-reduce:duration-100 sm:rounded-card",
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 motion-reduce:translate-y-0",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-base font-semibold text-escuro">Novo fornecedor</p>

        <div className="mt-4 flex flex-col gap-4">
          <Input label="Nome" value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
          <Input
            label="Telefone (opcional)"
            value={telefone}
            onChange={(e) => setTelefone(formatarTelefoneBR(e.target.value))}
            placeholder="(11) 91234-5678"
            inputMode="numeric"
          />
          <Input
            label="E-mail (opcional)"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@email.com"
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
