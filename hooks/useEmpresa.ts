"use client";

import { useAuth } from "@/hooks/useAuth";

/**
 * Acesso à empresa do usuário autenticado. É um atalho sobre useAuth() —
 * evita abrir um segundo listener/consulta ao Supabase para o mesmo dado que
 * o AuthProvider já carrega.
 */
export function useEmpresa() {
  const { empresa, loading, error } = useAuth();
  return { empresa, loading, error };
}
