"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { NovoFornecedorModal } from "./NovoFornecedorModal";

export default function FornecedoresPage() {
  const { empresa } = useEmpresa();
  const { fornecedores, loading, error, refetch } = useFornecedores();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar(dados: {
    nome: string;
    telefone: string;
    email: string;
  }) {
    if (!empresa) return;
    setSalvando(true);
    const { error: insertError } = await supabase.from("fornecedores").insert({
      empresa_id: empresa.id,
      nome: dados.nome,
      telefone: dados.telefone || null,
      email: dados.email || null,
    });
    setSalvando(false);

    if (insertError) {
      showToast("Não consegui salvar o fornecedor.");
      return;
    }

    showToast("Fornecedor cadastrado!");
    setModalAberto(false);
    refetch();
  }

  if (loading) {
    return (
      <div className="lg:mx-auto lg:max-w-2xl">
        <PageHeader title="Fornecedores" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full rounded-card" />
          <Skeleton className="h-16 w-full rounded-card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:mx-auto lg:max-w-2xl">
        <PageHeader title="Fornecedores" />
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-neutro-muted">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="text-sm font-semibold text-coral"
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <PageHeader
        title="Fornecedores"
        action={
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            aria-label="Novo fornecedor"
            className="flex h-9 w-9 items-center justify-center rounded-full text-coral transition-colors hover:bg-coral-light"
          >
            <Plus className="h-5 w-5" strokeWidth={2.25} />
          </button>
        }
      />

      {fornecedores.length === 0 ? (
        <p className="py-10 text-center text-sm text-neutro-muted">
          Nenhum fornecedor cadastrado ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {fornecedores.map((f) => (
            <Link
              key={f.id}
              href={`/fornecedores/${f.id}`}
              className="flex items-center gap-3 rounded-card border border-neutro-border bg-superficie p-3"
            >
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-coral-light text-coral">
                <Truck className="h-4 w-4" strokeWidth={2.25} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-escuro">{f.nome}</p>
                <p className="text-xs text-neutro-muted">
                  {f.telefone || f.email || "Sem contato"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <NovoFornecedorModal
        open={modalAberto}
        salvando={salvando}
        onSalvar={handleSalvar}
        onFechar={() => setModalAberto(false)}
      />
    </div>
  );
}
