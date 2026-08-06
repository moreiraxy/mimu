import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Client com a service role key — ignora RLS. Uso restrito a operações de
 * servidor sem contexto de usuário autenticado (ex.: rate limiting de
 * login/cadastro, que roda antes de existir sessão).
 *
 * ATENÇÃO: usa SUPABASE_SERVICE_ROLE_KEY (sem NEXT_PUBLIC_, nunca inlinada
 * no bundle do navegador) — só funciona chamado de código que roda no
 * servidor (Server Actions, Route Handlers). Nunca devolva o resultado
 * direto pro browser.
 */
export function createServiceClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
