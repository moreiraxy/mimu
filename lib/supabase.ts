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
import { planoEfetivo } from "@/lib/assinatura";
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
  async (): Promise<{
    user: User | null;
    empresa: Empresa | null;
    /**
     * O plano da conta. Decide o TETO de módulos — ver `modulosLiberados()`
     * em lib/planos.ts.
     *
     * Vem daqui junto com a empresa, e não de uma consulta separada, para o
     * servidor e o AuthProvider chegarem à MESMA lista de módulos. Se um dos
     * dois não souber o plano, a navegação é pintada com um teto no servidor
     * e outro depois da hidratação — o menu encolhe na cara de quem já ia
     * tocar num item.
     */
    plano: string | null;
  }> => {
    const supabase = createServerClientImpl();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, empresa: null, plano: null };
    }

    const { data } = await supabase
      .from("empresas")
      .select("*, assinaturas(status, plano, trial_fim, proxima_cobranca)")
      .eq("user_id", user.id)
      .single();

    if (!data) {
      return { user, empresa: null, plano: null };
    }

    // O join sai de dentro da empresa: quem consome `empresa` continua
    // recebendo exatamente a linha da tabela, sem saber que houve join.
    const { assinaturas, ...empresa } = data;
    const assinatura = Array.isArray(assinaturas)
      ? (assinaturas[0] ?? null)
      : (assinaturas ?? null);

    /*
     * O plano EFETIVO, e não o gravado.
     *
     * Uma assinatura 'pendente' guarda o plano que a pessoa escolheu e nunca
     * pagou. Devolver esse valor faria a navegação nascer com os módulos do
     * Pro para quem parou na tela de pagamento — e o middleware barraria cada
     * item ao ser tocado, um menu inteiro de portas fechadas.
     */
    return {
      user,
      empresa: empresa as Empresa,
      plano: planoEfetivo(assinatura),
    };
  },
);
