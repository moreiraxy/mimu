"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import type { Fornecedor } from "@/types";

/** Todos os fornecedores da empresa, ordenados por nome. */
export function useFornecedores() {
  const { empresa, loading: carregandoEmpresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("fornecedores")
      .select("*")
      .eq("empresa_id", empresa.id)
      .order("nome", { ascending: true });

    if (fetchError) {
      setError("Não foi possível carregar os fornecedores.");
      setLoading(false);
      return;
    }

    setFornecedores(data ?? []);
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
    fornecedores,
    loading: carregandoEmpresa || loading,
    error,
    refetch: carregar,
  };
}
