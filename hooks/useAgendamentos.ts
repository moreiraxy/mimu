"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import type { AgendamentoComCliente } from "@/types";

/** Agendamentos da empresa entre [inicioISO, fimISO], com o cliente embutido. */
export function useAgendamentos(inicioISO: string, fimISO: string) {
  const { empresa, loading: carregandoEmpresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  const [agendamentos, setAgendamentos] = useState<AgendamentoComCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("agendamentos")
      .select("*, cliente:clientes(*)")
      .eq("empresa_id", empresa.id)
      .gte("data_hora", `${inicioISO}T00:00:00`)
      .lte("data_hora", `${fimISO}T23:59:59`)
      .order("data_hora", { ascending: true });

    if (fetchError) {
      setError("Não foi possível carregar a agenda.");
      setLoading(false);
      return;
    }

    setAgendamentos((data ?? []) as unknown as AgendamentoComCliente[]);
    setLoading(false);
  }, [empresa, supabase, inicioISO, fimISO]);

  useEffect(() => {
    if (empresa) {
      carregar();
    } else if (!carregandoEmpresa) {
      setLoading(false);
    }
  }, [empresa, carregandoEmpresa, carregar]);

  return {
    agendamentos,
    loading: carregandoEmpresa || loading,
    error,
    refetch: carregar,
  };
}
