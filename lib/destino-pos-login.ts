import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { assinaturaVencida, trialVencido } from "@/lib/assinatura";

type Supabase = SupabaseClient<Database>;

/**
 * Para onde mandar alguém que acabou de entrar na conta.
 *
 * Existe porque o `redirect()` de uma Server Action navega pelo lado do
 * cliente, e essa navegação não passa pelo middleware do jeito que uma
 * requisição normal passa. Na prática, quem tinha pagamento pendente entrava
 * e caía no painel — só ao recarregar a página é que era mandada para o
 * checkout.
 *
 * O middleware continua sendo a trava de verdade, aplicada em toda navegação
 * seguinte. Isto aqui só evita a parada errada logo depois do login.
 */
export async function destinoAposLogin(
  supabase: Supabase,
  userId: string,
): Promise<string> {
  const { data: empresa } = await supabase
    .from("empresas")
    .select("id, onboarding_concluido, suspensa_em")
    .eq("user_id", userId)
    .maybeSingle();

  if (!empresa) return "/onboarding";
  if (empresa.suspensa_em) return "/conta-suspensa";
  if (!empresa.onboarding_concluido) return "/onboarding";

  const { data: assinatura } = await supabase
    .from("assinaturas")
    .select("status, trial_fim, proxima_cobranca")
    .eq("empresa_id", empresa.id)
    .maybeSingle();

  if (!assinatura || assinatura.status === "pendente") return "/assinar";

  if (
    assinatura.status === "vencida" ||
    assinatura.status === "cancelada" ||
    trialVencido(assinatura) ||
    // Paga, mas o prazo comprado já passou.
    assinaturaVencida(assinatura)
  ) {
    return "/trial-vencido";
  }

  return "/dashboard";
}
