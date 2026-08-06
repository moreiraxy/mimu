"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tema } from "@/types";

export interface ThemeContextValue {
  tema: Tema;
  alternarTema: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);

/**
 * Aplica/persiste o tema claro/escuro. Precisa estar dentro de <AuthProvider>
 * — usa empresa.tema como fonte de verdade e cai pra "claro" antes disso
 * carregar (aceita um flash claro→escuro em vez de bloquear a renderização
 * ou depender de cookie/script inline no <head>, que é mais complexidade do
 * que esse app precisa hoje).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { empresa } = useAuth();
  const [supabase] = useState(() => createClient());
  const [tema, setTema] = useState<Tema>("claro");

  useEffect(() => {
    if (empresa?.tema) setTema(empresa.tema);
  }, [empresa?.tema]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "escuro");
  }, [tema]);

  const alternarTema = useCallback(() => {
    setTema((atual) => {
      const novo: Tema = atual === "claro" ? "escuro" : "claro";
      if (empresa) {
        supabase
          .from("empresas")
          .update({ tema: novo })
          .eq("id", empresa.id)
          .then();
      }
      return novo;
    });
  }, [empresa, supabase]);

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
}
