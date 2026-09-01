"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { guardaNoCache, leDoCache } from "@/lib/cache-de-tela";
import { useEmpresa } from "@/hooks/useEmpresa";
import type { AgendamentoComCliente } from "@/types";

/** Agendamentos da empresa entre [inicioISO, fimISO], com o cliente embutido. */
export function useAgendamentos(inicioISO: string, fimISO: string) {
  const { empresa, loading: carregandoEmpresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  /*
   * A chave inclui O INTERVALO, e não só a empresa: dia, semana e mês são
   * três buscas diferentes na mesma tela, e uma chave só faria a visão de mês
   * abrir com os agendamentos de um dia.
   */
  const chaveCache = `agendamentos:${empresa?.id ?? ""}:${inicioISO}:${fimISO}`;
  const [agendamentos, setAgendamentos] = useState<AgendamentoComCliente[]>(
    () => leDoCache<AgendamentoComCliente[]>(chaveCache) ?? [],
  );
  const [loading, setLoading] = useState(
    () => leDoCache<AgendamentoComCliente[]>(chaveCache) === undefined,
  );
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    // Esqueleto só quando não há o que mostrar; com dado em mão, a atualização
    // acontece por baixo e a tela não pisca. Ver lib/cache-de-tela.ts.
    if (leDoCache(chaveCache) === undefined) setLoading(true);
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

    const lista = (data ?? []) as unknown as AgendamentoComCliente[];
    setAgendamentos(lista);
    guardaNoCache(chaveCache, lista);
    setLoading(false);
  }, [empresa, supabase, inicioISO, fimISO, chaveCache]);

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
