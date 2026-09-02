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
 * — usa empresa.tema como fonte de verdade e cai pra "escuro" antes disso
 * carregar (aceita um flash claro→escuro em vez de bloquear a renderização
 * ou depender de cookie/script inline no <head>, que é mais complexidade do
 * que esse app precisa hoje).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const { empresa } = useAuth();
  const [supabase] = useState(() => createClient());
  /*
   * Escuro é o padrão porque o site inteiro é escuro: landing, cadastro,
   * onboarding e checkout. Começar no claro fazia a pessoa atravessar quatro
   * telas pretas e cair numa branca.
   *
   * Este valor também decide a cor do primeiro instante, antes de a empresa
   * carregar. Antes o piscar era claro para escuro, que é o mais incômodo dos
   * dois; agora quem escolheu claro vê escuro por um átimo, o que é menos
   * agressivo do que o contrário.
   */
  const [tema, setTema] = useState<Tema>("escuro");

  useEffect(() => {
    if (empresa?.tema) setTema(empresa.tema);
  }, [empresa?.tema]);

  /*
   * O <html> já nasce com `dark` vindo do servidor (ver app/layout.tsx), então
   * este efeito não é mais quem ACENDE o tema escuro — é quem o APAGA, quando
   * a empresa escolheu o claro. A troca ficou de uma direção só, e a abertura
   * deixou de piscar branco.
   */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "escuro");

    /*
     * Guarda a escolha para a PRÓXIMA abertura.
     *
     * Quem lê isto é o script embutido no <head> (ver app/layout.tsx), que roda
     * antes da primeira pintura. Sem ele, quem usa o tema claro atravessava uma
     * virada de tema inteira a cada abertura — e virar o tema repinta todas as
     * superfícies de vidro de uma vez, o que custa centenas de milissegundos.
     *
     * O banco continua sendo a fonte da verdade: isto aqui é só um atalho para
     * o primeiro quadro, e é corrigido assim que a empresa chega.
     */
    try {
      window.localStorage.setItem("mimu:tema", tema);
    } catch {
      // Armazenamento bloqueado: volta a valer o comportamento de antes.
    }
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
