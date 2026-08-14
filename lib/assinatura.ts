import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Assinatura } from "@/types";
import { VALOR_MENSAL_MIMU } from "@/lib/mercadopago";

type Supabase = SupabaseClient<Database>;

// 7 dias é o que a landing page e a página de preço prometem. Já foi 14
// aqui, o que dava ao cadastro o dobro do anunciado; alinhado ao site.
const DIAS_TRIAL = 7;

/** Chamado uma vez, ao concluir o onboarding — cada empresa só ganha um trial. */
export async function criarAssinaturaTrial(
  supabase: Supabase,
  empresaId: string,
) {
  const agora = new Date();
  const trialFim = new Date(agora);
  trialFim.setDate(trialFim.getDate() + DIAS_TRIAL);

  return supabase.from("assinaturas").insert({
    empresa_id: empresaId,
    status: "trial",
    trial_inicio: agora.toISOString(),
    trial_fim: trialFim.toISOString(),
    valor_mensal: VALOR_MENSAL_MIMU,
  });
}

/** Empresa + assinatura do usuário logado, num único lugar — usado pelas 3 rotas de pagamento. */
export async function buscarEmpresaEAssinatura(supabase: Supabase, userId: string) {
  const { data: empresa } = await supabase
    .from("empresas")
    .select("id, nome")
    .eq("user_id", userId)
    .maybeSingle();

  if (!empresa) return { empresa: null, assinatura: null };

  const assinatura = await buscarAssinatura(supabase, empresa.id);
  return { empresa, assinatura };
}

/** Busca a assinatura da empresa do usuário logado (uma por empresa). */
export async function buscarAssinatura(
  supabase: Supabase,
  empresaId: string,
): Promise<Assinatura | null> {
  const { data } = await supabase
    .from("assinaturas")
    .select("*")
    .eq("empresa_id", empresaId)
    .maybeSingle();

  return data;
}

export function trialVencido(
  assinatura: Pick<Assinatura, "status" | "trial_fim">,
): boolean {
  if (assinatura.status !== "trial" || !assinatura.trial_fim) return false;
  return new Date(assinatura.trial_fim) < new Date();
}

/** true quando a empresa pode usar o app normalmente (trial em dia ou assinatura ativa). */
export function acessoLiberado(
  assinatura: Pick<Assinatura, "status" | "trial_fim">,
): boolean {
  if (assinatura.status === "ativa") return true;
  if (assinatura.status === "trial") return !trialVencido(assinatura);
  return false;
}

/** Ativa a assinatura depois de um pagamento aprovado (Pix ou cartão). */
export async function ativarAssinatura(
  supabase: Supabase,
  assinaturaId: string,
) {
  const proximaCobranca = new Date();
  proximaCobranca.setMonth(proximaCobranca.getMonth() + 1);

  return supabase
    .from("assinaturas")
    .update({
      status: "ativa",
      proxima_cobranca: proximaCobranca.toISOString(),
    })
    .eq("id", assinaturaId);
}
