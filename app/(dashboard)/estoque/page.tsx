"use client";

import { useState } from "react";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Settings2, SlidersHorizontal } from "lucide-react";
import { useEstoque } from "@/hooks/useEstoque";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatDateShort } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { AjustarEstoqueModal } from "./AjustarEstoqueModal";
import type { TipoMovimentacaoEstoque } from "@/types";

const TIPO_CONFIG: Record<
  TipoMovimentacaoEstoque,
  { label: string; icone: typeof ArrowUpCircle; cor: string }
> = {
  entrada: { label: "Entrada", icone: ArrowUpCircle, cor: "text-verde-texto" },
  saida: { label: "Saída", icone: ArrowDownCircle, cor: "text-erro-texto" },
  ajuste: { label: "Correção", icone: Settings2, cor: "text-ambar-texto" },
};

export default function EstoquePage() {
  const {
    movimentacoes,
    produtos,
    produtosAbaixoDoMinimo,
    loading,
    error,
    refetch,
    registrarMovimentacao,
  } = useEstoque();
  const { showToast } = useToast();
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar(dados: {
    produtoId: string;
    tipo: "entrada" | "ajuste";
    quantidade: number;
    motivo: string;
  }) {
    setSalvando(true);
    const ok = await registrarMovimentacao(dados);
    setSalvando(false);
    if (!ok) {
      showToast("Não consegui registrar o ajuste.");
      return;
    }
    showToast("Estoque atualizado!");
    setModalAberto(false);
  }

  if (loading) {
    return (
      <div className="lg:mx-auto lg:max-w-2xl">
        <PageHeader title="Estoque" />
        <Skeleton className="h-24 w-full rounded-card" />
        <div className="mt-4 flex flex-col gap-2">
          <Skeleton className="h-14 w-full rounded-card" />
          <Skeleton className="h-14 w-full rounded-card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:mx-auto lg:max-w-2xl">
        <PageHeader title="Estoque" />
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-neutro-muted">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="text-sm font-semibold text-primary-forte"
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <PageHeader title="Estoque" />

      {produtosAbaixoDoMinimo.length > 0 && (
        <div className="mb-4 rounded-card bg-ambar-light p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ambar-texto">
            <AlertTriangle className="h-4 w-4" strokeWidth={2.25} />
            {produtosAbaixoDoMinimo.length === 1
              ? "1 produto com estoque baixo"
              : `${produtosAbaixoDoMinimo.length} produtos com estoque baixo`}
          </p>
          <div className="mt-2 flex flex-col gap-1">
            {produtosAbaixoDoMinimo.map((p) => (
              <p key={p.id} className="text-xs text-neutro-muted">
                {p.nome}: restam {p.quantidade_estoque} un. (mínimo {p.quantidade_minima})
              </p>
            ))}
          </div>
        </div>
      )}

      <Button
        variant="secondary"
        className="flex w-full items-center justify-center gap-2"
        onClick={() => setModalAberto(true)}
      >
        <SlidersHorizontal className="h-4 w-4" strokeWidth={2.25} />
        Ajustar estoque
      </Button>

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold text-neutro-muted">
          Histórico de movimentações
        </p>
        {movimentacoes.length === 0 ? (
          <p className="py-10 text-center text-sm text-neutro-muted">
            Nenhuma movimentação registrada ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {movimentacoes.map((m) => {
              const config = TIPO_CONFIG[m.tipo];
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 vidro-card rounded-[20px] p-3"
                >
                  <config.icone
                    className={cn("h-5 w-5 flex-shrink-0", config.cor)}
                    strokeWidth={2}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-escuro">
                      {m.produto?.nome ?? "Produto removido"}
                    </p>
                    <p className="text-xs text-neutro-muted">
                      {config.label}
                      {m.motivo ? ` · ${m.motivo}` : ""} ·{" "}
                      {formatDateShort(m.created_at)}
                    </p>
                  </div>
                  <p className={cn("flex-shrink-0 text-sm font-semibold", config.cor)}>
                    {m.tipo === "ajuste" ? "=" : m.tipo === "entrada" ? "+" : "-"}
                    {m.quantidade}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AjustarEstoqueModal
        open={modalAberto}
        produtos={produtos}
        salvando={salvando}
        onSalvar={handleSalvar}
        onFechar={() => setModalAberto(false)}
      />
    </div>
  );
}
