"use client";

import {
  createContext,
  useCallback,
  useRef,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Empresa } from "@/types";

export interface AuthContextValue {
  user: User | null;
  empresa: Empresa | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  /**
   * Troca a empresa em memória depois de uma alteração salva.
   *
   * Existe porque a tela de Minha Empresa guardava o resultado num estado
   * dela mesma. O banco era atualizado, a tela mostrava o novo valor, e o
   * resto do app seguia com a lista velha: quem ligava o módulo da Mimu
   * depois de entrar não via o item aparecer no menu, e ficava sem caminho
   * para o chat até recarregar a página inteira.
   *
   * Recebe a empresa já pronta em vez de buscar de novo: quem salvou acabou
   * de escrever esses dados e não precisa perguntar ao banco o que ela mesma
   * mandou gravar.
   */
  atualizarEmpresa: (empresa: Empresa) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  /**
   * De quem é a empresa que já está carregada.
   *
   * Sem isto, a empresa era buscada duas vezes em todo carregamento: o
   * `getUser()` e o `onAuthStateChange` disparam os dois na montagem, e cada
   * um chamava `loadEmpresa`. Pior que o pedido repetido era a consequência:
   * cada resposta criava um OBJETO novo de empresa, e quem depende dela (o
   * painel inteiro) refazia as próprias consultas. Medido num celular médio,
   * eram 15 idas ao Supabase para montar o painel, com as mesmas quatro
   * tabelas buscadas três vezes cada.
   */
  const donoCarregado = useRef<string | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEmpresa = useCallback(
    async (userId: string) => {
      if (donoCarregado.current === userId) return;
      donoCarregado.current = userId;

      const { data, error: fetchError } = await supabase
        .from("empresas")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        // Volta a marcar como não carregada: falhou, então a próxima tentativa
        // precisa realmente tentar de novo em vez de achar que já tem.
        donoCarregado.current = null;
        setEmpresa(null);
        setError("Não foi possível carregar os dados da empresa.");
        return;
      }

      setEmpresa(data);
      setError(null);
    },
    [supabase],
  );

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        await loadEmpresa(data.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadEmpresa(session.user.id);
      } else {
        donoCarregado.current = null;
        setEmpresa(null);
        setError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadEmpresa]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  return (
    <AuthContext.Provider
      value={{ user, empresa, loading, error, signOut, atualizarEmpresa: setEmpresa }}
    >
      {children}
    </AuthContext.Provider>
  );
}
