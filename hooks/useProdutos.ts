"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import type { Produto } from "@/types";

/** Todos os produtos da empresa, ordenados por nome — busca/filtro ficam no client. */
export function useProdutos() {
  const { empresa, loading: carregandoEmpresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);
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

    setProdutos(data ?? []);
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
