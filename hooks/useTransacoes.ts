"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { guardaNoCache, leDoCache, limpaCache } from "@/lib/cache-de-tela";
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
  // Abre com o que já tinha e busca por trás — ver lib/cache-de-tela.ts.
  const chaveCache = `transacoes:${empresa?.id ?? ""}`;
  const [transacoes, setTransacoes] = useState<TransacaoComCliente[]>(
    () => leDoCache<TransacaoComCliente[]>(chaveCache) ?? [],
  );
  const [loading, setLoading] = useState(
    () => leDoCache<TransacaoComCliente[]>(chaveCache) === undefined,
  );
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    // Só mostra esqueleto quando NÃO há nada para mostrar. Com dado em mão, a
    // atualização acontece por baixo e a tela não pisca.
    if (leDoCache(chaveCache) === undefined) setLoading(true);
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

    const lista = (data ?? []) as unknown as TransacaoComCliente[];
    setTransacoes(lista);
    guardaNoCache(chaveCache, lista);
    setLoading(false);
  }, [empresa, supabase, chaveCache]);

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

      /*
       * Esquece TUDO que estava guardado, e não só a lista daqui.
       *
       * Um lançamento apagado muda o saldo do painel, o faturamento do mês, o
       * progresso da meta e o total gasto da cliente. Apagar só a chave desta
       * tela deixaria as outras mostrando um número velho com cara de número
       * certo — que é o pior defeito possível num app de dinheiro.
       */
      limpaCache();
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
