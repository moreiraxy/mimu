"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { limpaCache } from "@/lib/cache-de-tela";
import { useEmpresa } from "@/hooks/useEmpresa";
import { produtoAbaixoDoMinimo } from "@/lib/calculations";
import type { MovimentacaoComProduto, Produto } from "@/types";

const LIMITE_MOVIMENTACOES = 100;

/** Histórico de movimentações + produtos (pra popular o select e o alerta de estoque baixo). */
export function useEstoque() {
  const { empresa, loading: carregandoEmpresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoComProduto[]>(
    [],
  );
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);
    setError(null);

    const [movimentacoesResult, produtosResult] = await Promise.all([
      supabase
        .from("movimentacoes_estoque")
        .select("*, produto:produtos(id, nome)")
        .eq("empresa_id", empresa.id)
        .order("created_at", { ascending: false })
        .limit(LIMITE_MOVIMENTACOES),
      supabase
        .from("produtos")
        .select("*")
        .eq("empresa_id", empresa.id)
        .eq("ativo", true)
        .order("nome", { ascending: true }),
    ]);

    if (movimentacoesResult.error || produtosResult.error) {
      setError("Não foi possível carregar o estoque.");
      setLoading(false);
      return;
    }

    setMovimentacoes(
      (movimentacoesResult.data ?? []) as unknown as MovimentacaoComProduto[],
    );
    setProdutos(produtosResult.data ?? []);
    setLoading(false);
  }, [empresa, supabase]);

  useEffect(() => {
    if (empresa) {
      carregar();
    } else if (!carregandoEmpresa) {
      setLoading(false);
    }
  }, [empresa, carregandoEmpresa, carregar]);

  const produtosAbaixoDoMinimo = produtos.filter(produtoAbaixoDoMinimo);

  async function registrarMovimentacao(dados: {
    produtoId: string;
    tipo: "entrada" | "ajuste";
    quantidade: number;
    motivo: string;
  }) {
    if (!empresa) return false;
    const { error: insertError } = await supabase
      .from("movimentacoes_estoque")
      .insert({
        empresa_id: empresa.id,
        produto_id: dados.produtoId,
        tipo: dados.tipo,
        quantidade: dados.quantidade,
        motivo: dados.motivo || null,
      });
      // As listas guardadas ficaram velhas — ver lib/cache-de-tela.ts.
      limpaCache();

    if (insertError) return false;
    await carregar();
    return true;
  }

  return {
    movimentacoes,
    produtos,
    produtosAbaixoDoMinimo,
    loading: carregandoEmpresa || loading,
    error,
    refetch: carregar,
    registrarMovimentacao,
  };
}
