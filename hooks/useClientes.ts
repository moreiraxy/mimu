"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import type { Cliente } from "@/types";

/** Todos os clientes da empresa, ordenados por nome — busca/filtro ficam no client. */
export function useClientes() {
  const { empresa, loading: carregandoEmpresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("clientes")
      .select("*")
      .eq("empresa_id", empresa.id)
      .order("nome", { ascending: true });

    if (fetchError) {
      setError("Não foi possível carregar os clientes.");
      setLoading(false);
      return;
    }

    setClientes(data ?? []);
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
    clientes,
    loading: carregandoEmpresa || loading,
    error,
    refetch: carregar,
  };
}
