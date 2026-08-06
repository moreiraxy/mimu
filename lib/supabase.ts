/**
 * Ponto único de acesso ao Supabase no projeto.
 *
 * ATENÇÃO: este arquivo importa `@/lib/supabase/server`, que por sua vez usa
 * `next/headers` (server-only). NÃO importe nada deste arquivo a partir de um
 * Client Component ("use client") — o bundler tentaria incluir o código de
 * servidor no bundle do navegador e o build quebra. Em Client Components/
 * hooks client-side, importe direto de `@/lib/supabase/client`.
 */
import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient as createBrowserClientImpl } from "@/lib/supabase/client";
import { createClient as createServerClientImpl } from "@/lib/supabase/server";
import type { Empresa } from "@/types";

/** Client do Supabase para uso em Client Components. */
export const createBrowserSupabaseClient = createBrowserClientImpl;

/** Client do Supabase para Server Components, Route Handlers e Server Actions. */
export const createServerSupabaseClient = createServerClientImpl;

/**
 * Usuário e empresa autenticados no request atual. Memoizado com
 * `React.cache`: chamar várias vezes no mesmo request/render (ex.: layout e
 * page da mesma rota) não repete a consulta ao Supabase.
 */
export const getEmpresaAtual = cache(
  async (): Promise<{ user: User | null; empresa: Empresa | null }> => {
    const supabase = createServerClientImpl();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, empresa: null };
    }

    const { data: empresa } = await supabase
      .from("empresas")
      .select("*")
      .eq("user_id", user.id)
      .single();

    return { user, empresa };
  },
);
