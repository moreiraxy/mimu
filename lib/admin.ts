import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Autorização do painel admin. TUDO aqui é servidor.
 *
 * `import "server-only"` no topo é proposital: se algum componente com
 * "use client" importar este arquivo por engano, o build QUEBRA em vez de
 * mandar a lógica de admin pro navegador. É a rede de segurança contra o
 * cenário clássico — a tela decidir quem é admin e alguém trocar o valor no
 * DevTools.
 *
 * A tabela `admins` tem RLS ativo e nenhuma policy, então só a service role
 * consegue lê-la. Não existe caminho pelo cliente, nem para consultar.
 */

/** true se este usuário está na tabela `admins`. Nunca confie no cliente para isso. */
export async function ehAdmin(userId: string | undefined | null): Promise<boolean> {
  if (!userId) return false;

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // Falha fechada: erro de banco não pode virar acesso liberado.
    console.error("Erro ao verificar admin:", error);
    return false;
  }

  return Boolean(data);
}

/**
 * Uma linha da view `admin_contas` — dados da DONA da conta e da assinatura.
 * Os dados dos clientes dela nunca passam por aqui (ver a migration).
 */
export type ContaAdmin = {
  empresa_id: string;
  user_id: string;
  email: string | null;
  nome_negocio: string;
  tipo_negocio: string | null;
  telefone: string | null;
  endereco: string | null;
  onboarding_concluido: boolean;
  modulos_ativos: string[];
  entrou_em: string;
  ultimo_acesso: string | null;
  status_assinatura: string;
  plano: string | null;
  valor_mensal: number | null;
  trial_fim: string | null;
  proxima_cobranca: string | null;
  dias_restantes_trial: number | null;
};
