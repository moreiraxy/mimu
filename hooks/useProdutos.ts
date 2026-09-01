"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { guardaNoCache, leDoCache } from "@/lib/cache-de-tela";
import { useEmpresa } from "@/hooks/useEmpresa";
import type { Produto } from "@/types";

/** Todos os produtos da empresa, ordenados por nome — busca/filtro ficam no client. */
export function useProdutos() {
  const { empresa, loading: carregandoEmpresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  // Abre com o que já tinha e busca por trás — ver lib/cache-de-tela.ts.
  const chaveCache = `produtos:${empresa?.id ?? ""}`;
  const [produtos, setProdutos] = useState<Produto[]>(
    () => leDoCache<Produto[]>(chaveCache) ?? [],
  );
  const [loading, setLoading] = useState(
    () => leDoCache<Produto[]>(chaveCache) === undefined,
  );
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    if (leDoCache(chaveCache) === undefined) setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("produtos")
      .select("*")
      .eq("empresa_id", empresa.id)
      .order("nome", { ascending: true });

    if (fetchError) {
      setError("Não foi possível carregar os produtos.");
      setLoading(false);
      return;
    }

    const lista = data ?? [];
    setProdutos(lista);
    guardaNoCache(chaveCache, lista);
    setLoading(false);
  }, [empresa, supabase]);

  useEffect(() => {
    if (empresa) {
      carregar();
    } else if (!carregandoEmpresa) {
      setLoading(false);
    }
  }, [empresa, carregandoEmpresa, carregar]);

  return {
    produtos,
    loading: carregandoEmpresa || loading,
    error,
    refetch: carregar,
  };
}
