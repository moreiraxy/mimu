"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import type { Categoria, TipoCategoria } from "@/types";

/** Categorias da empresa atual para um tipo (entrada/saída) — editáveis em Minha Empresa. */
export function useCategorias(tipo: TipoCategoria) {
  const { empresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);
    const { data } = await supabase
      .from("categorias")
      .select("*")
      .eq("empresa_id", empresa.id)
      .eq("tipo", tipo)
      .order("nome");
    setCategorias(data ?? []);
    setLoading(false);
  }, [empresa, supabase, tipo]);

  useEffect(() => {
    if (empresa) carregar();
  }, [empresa, carregar]);

  return { categorias, loading, refetch: carregar };
}
