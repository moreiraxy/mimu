"use client";

import { PageHeader } from "@/components/PageHeader";
import { useState } from "react";
import { useTransacoes } from "@/hooks/useTransacoes";
import { useToast } from "@/hooks/useToast";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { calcularSaldoCaixa } from "@/lib/calculations";
import { SaldoHeader } from "./SaldoHeader";
import { GraficoMovimentacao } from "./GraficoMovimentacao";
import { AcoesFinanceiro } from "./AcoesFinanceiro";
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
        <p className="text-[15px] text-neutro-muted">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="text-[15px] font-bold text-primary-forte"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  const saldo = calcularSaldoCaixa(transacoes);
  // As duas linhas de apoio do cartão de saldo são a CONTA daquele número:
  // entradas menos saídas. Somadas aqui, do mesmo array, elas não podem
  // divergir do saldo por cima.
  const entradas = transacoes
    .filter((t) => t.tipo === "entrada")
    .reduce((soma, t) => soma + Number(t.valor), 0);
  const saidas = transacoes
    .filter((t) => t.tipo === "saida")
    .reduce((soma, t) => soma + Number(t.valor), 0);
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
    <div className="flex flex-col gap-5 lg:mx-auto lg:max-w-5xl">
      {/* SEM <FadeIn> AQUI: a transição de opacidade faz do elemento um
          "backdrop root" enquanto roda, e todo o vidro de dentro perde o
          desfoque por 150ms a cada navegação — a tela entra chapada e só
          então vira vidro. É o mesmo motivo comentado em dashboard/page.tsx. */}
      <PageHeader title="Financeiro" voltar={false} />

      <SaldoHeader saldo={saldo} entradas={entradas} saidas={saidas} />

      <AcoesFinanceiro />

      <GraficoMovimentacao transacoes={transacoes} />

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
    </div>
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
