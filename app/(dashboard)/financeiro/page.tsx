"use client";

import Link from "next/link";
import { useState } from "react";
import { useTransacoes } from "@/hooks/useTransacoes";
import { useToast } from "@/hooks/useToast";
import { Skeleton } from "@/components/ui/Skeleton";
import { FadeIn } from "@/components/ui/FadeIn";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { calcularSaldoCaixa } from "@/lib/calculations";
import { SaldoHeader } from "./SaldoHeader";
import { GraficoBarras } from "./GraficoBarras";
import { FiltrosChips } from "./FiltrosChips";
import { CategoriaChips } from "./CategoriaChips";
import { ListaTransacoes } from "./ListaTransacoes";
import {
  aplicarFiltro,
  aplicarFiltroCategoria,
  agruparPorData,
  categoriasDisponiveis,
  type FiltroTransacao,
} from "./filtros";

export default function FinanceiroPage() {
  const { transacoes, loading, error, refetch, excluirTransacao } =
    useTransacoes();
  const { showToast } = useToast();
  const [filtro, setFiltro] = useState<FiltroTransacao>("Todos");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string | null>(null);
  const [idParaExcluir, setIdParaExcluir] = useState<string | null>(null);

  if (loading) {
    return <FinanceiroSkeleton />;
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-neutro-muted">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="text-sm font-semibold text-primary-forte"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  const saldo = calcularSaldoCaixa(transacoes);
  const filtradasPorTipoData = aplicarFiltro(transacoes, filtro);
  const filtradas = aplicarFiltroCategoria(filtradasPorTipoData, categoriaFiltro);
  const grupos = agruparPorData(filtradas);
  const categorias = categoriasDisponiveis(transacoes);

  async function confirmarExclusao() {
    if (!idParaExcluir) return;
    const resultado = await excluirTransacao(idParaExcluir);
    setIdParaExcluir(null);
    if (resultado.error) {
      showToast(resultado.error);
    } else {
      showToast("Lançamento excluído.");
    }
  }

  return (
    <FadeIn className="flex flex-col gap-5 lg:mx-auto lg:max-w-3xl">
      <SaldoHeader saldo={saldo} />

      <div className="flex gap-3">
        <Link
          href="/financeiro/nova-entrada"
          className="flex-1 rounded-button bg-primary py-3 text-center text-sm font-bold text-primary-text"
        >
          + Entrada
        </Link>
        <Link
          href="/financeiro/nova-saida"
          className="flex-1 rounded-button border-[1.5px] border-primary-forte py-3 text-center text-sm font-bold text-primary-forte"
        >
          − Saída
        </Link>
      </div>

      <GraficoBarras transacoes={transacoes} />

      <FiltrosChips ativo={filtro} onChange={setFiltro} />

      <CategoriaChips
        categorias={categorias}
        ativa={categoriaFiltro}
        onChange={setCategoriaFiltro}
      />

      <ListaTransacoes grupos={grupos} onExcluir={setIdParaExcluir} />

      <ConfirmDialog
        open={idParaExcluir !== null}
        title="Excluir lançamento?"
        description="Isso não pode ser desfeito."
        confirmLabel="Excluir"
        onConfirm={confirmarExclusao}
        onCancel={() => setIdParaExcluir(null)}
      />
    </FadeIn>
  );
}

function FinanceiroSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 py-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-11 flex-1 rounded-button" />
        <Skeleton className="h-11 flex-1 rounded-button" />
      </div>
      <Skeleton className="h-32 w-full rounded-card" />
      <Skeleton className="h-8 w-full rounded-full" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-14 w-full rounded-card" />
        <Skeleton className="h-14 w-full rounded-card" />
        <Skeleton className="h-14 w-full rounded-card" />
      </div>
    </div>
  );
}
