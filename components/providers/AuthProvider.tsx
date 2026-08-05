"use client";

import {
  createContext,
  useCallback,
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
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);

  const loadEmpresa = useCallback(
    async (userId: string) => {
      const { data } = await supabase
        .from("empresas")
        .select("*")
        .eq("user_id", userId)
        .single();
      setEmpresa(data ?? null);
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
        setEmpresa(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, loadEmpresa]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, empresa, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
