"use client";

import { useState } from "react";
import { Tags, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useCategorias } from "@/hooks/useCategorias";
import { useToast } from "@/hooks/useToast";
import { SectionCard } from "./SectionCard";
import type { TipoCategoria } from "@/types";

function ListaCategoria({ tipo, titulo }: { tipo: TipoCategoria; titulo: string }) {
  const { empresa } = useEmpresa();
  const { categorias, refetch } = useCategorias(tipo);
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());
  const [novaCategoria, setNovaCategoria] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function adicionar() {
    const nome = novaCategoria.trim();
    if (!nome || !empresa) return;
    setEnviando(true);

    const { error } = await supabase
      .from("categorias")
      .insert({ empresa_id: empresa.id, tipo, nome });

    setEnviando(false);

    if (error) {
      showToast(
        error.code === "23505"
          ? "Essa categoria já existe."
          : "Não consegui adicionar.",
      );
      return;
    }

    setNovaCategoria("");
    refetch();
  }

  async function excluir(id: string) {
    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) {
      showToast("Não consegui excluir.");
      return;
    }
    refetch();
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-neutro-muted">{titulo}</p>
      <div className="flex flex-wrap gap-2">
        {categorias.map((categoria) => (
          <span
            key={categoria.id}
            className="flex items-center gap-1.5 rounded-full border border-neutro-border bg-fundo py-1.5 pl-3.5 pr-2 text-xs font-semibold text-escuro"
          >
            {categoria.nome}
            <button
              type="button"
              aria-label={`Excluir categoria ${categoria.nome}`}
              onClick={() => excluir(categoria.id)}
              className="flex h-4 w-4 items-center justify-center rounded-full text-neutro-muted transition-colors hover:bg-erro-light hover:text-erro-texto"
            >
              <X className="h-3 w-3" strokeWidth={2.5} />
            </button>
          </span>
        ))}
        {categorias.length === 0 && (
          <p className="text-xs text-neutro-muted">Nenhuma categoria ainda.</p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={novaCategoria}
          onChange={(e) => setNovaCategoria(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              adicionar();
            }
          }}
          placeholder="Nova categoria..."
          className="flex-1 rounded-button border border-neutro-border bg-fundo px-3.5 py-2 text-base text-escuro outline-none focus:border-primary-forte md:text-sm"
        />
        <button
          type="button"
          onClick={adicionar}
          disabled={!novaCategoria.trim() || enviando}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-button bg-primary text-primary-text transition-colors hover:bg-primary-hover disabled:bg-neutro-disabled disabled:text-neutro-disabled-text"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export function CategoriasSection() {
  return (
    <SectionCard
      icone={Tags}
      titulo="Categorias"
      descricao="Usadas ao registrar entradas e saídas no Financeiro."
    >
      <div className="flex flex-col gap-5">
        <ListaCategoria tipo="entrada" titulo="Entrada" />
        <ListaCategoria tipo="saida" titulo="Saída" />
      </div>
    </SectionCard>
  );
}
