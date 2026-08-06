"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import type { TransacaoComCliente } from "@/types";

const JANELA_DIAS = 180;

function diasAtrasISO(dias: number): string {
  const data = new Date();
  data.setDate(data.getDate() - dias);
  return data.toISOString().slice(0, 10);
}

/**
 * Transações dos últimos 180 dias da empresa atual, com o cliente já
 * embutido. Sem paginação por enquanto — razoável para o volume de um
 * microempreendedor; se crescer muito isso precisa virar paginado.
 */
export function useTransacoes() {
  const { empresa, loading: carregandoEmpresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  const [transacoes, setTransacoes] = useState<TransacaoComCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("transacoes")
      .select("*, cliente:clientes(*)")
      .eq("empresa_id", empresa.id)
      .gte("data", diasAtrasISO(JANELA_DIAS))
      .order("data", { ascending: false })
      .order("created_at", { ascending: false });

    if (fetchError) {
      setError("Não foi possível carregar as transações.");
      setLoading(false);
      return;
    }

    setTransacoes((data ?? []) as unknown as TransacaoComCliente[]);
    setLoading(false);
  }, [empresa, supabase]);

  useEffect(() => {
    if (empresa) {
      carregar();
    } else if (!carregandoEmpresa) {
      setLoading(false);
    }
  }, [empresa, carregandoEmpresa, carregar]);

  /** Exclui com atualização otimista; reverte a lista se a exclusão falhar. */
  const excluirTransacao = useCallback(
    async (id: string) => {
      const anteriores = transacoes;
      setTransacoes((atual) => atual.filter((t) => t.id !== id));

      const { error: deleteError } = await supabase
        .from("transacoes")
        .delete()
        .eq("id", id);

      if (deleteError) {
        setTransacoes(anteriores);
        return { error: "Não foi possível excluir. Tente de novo." };
      }
      return { error: null };
    },
    [supabase, transacoes],
  );

  return {
    transacoes,
    loading: carregandoEmpresa || loading,
    error,
    refetch: carregar,
    excluirTransacao,
  };
}
