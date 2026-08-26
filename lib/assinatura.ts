import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { Assinatura } from "@/types";
import { VALOR_MENSAL_MIMU } from "@/lib/mercadopago";
import {
  PLANOS,
  proximaCobrancaDe,
  type Periodicidade,
  type PlanoPago,
} from "@/lib/planos";

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

/**
 * Criada quando a pessoa escolhe um plano PAGO na landing: a conta nasce sem
 * teste grátis e sem acesso, esperando o pagamento.
 *
 * Existe como linha (em vez de simplesmente não haver assinatura) porque o
 * checkout precisa de um id para referenciar no Mercado Pago, e é por ele que
 * o webhook encontra a assinatura na volta.
 */
export async function criarAssinaturaPendente(
  supabase: Supabase,
  empresaId: string,
  plano: PlanoPago,
) {
  return supabase.from("assinaturas").insert({
    empresa_id: empresaId,
    status: "pendente",
    plano,
    valor_mensal: PLANOS[plano].valorMensal,
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

/**
 * true quando uma assinatura ATIVA já passou da data que foi paga.
 *
 * Existe porque `ativa` não vencia sozinha. A data da próxima cobrança era
 * gravada e nunca mais lida: quem pagou um mês, ou um ano, continuava com o app
 * liberado indefinidamente até alguém marcar `vencida` na mão. Numa venda anual
 * isso é um ano inteiro de graça passando despercebido.
 *
 * O trial já funcionava assim, comparando `trial_fim` com agora. Aqui é a mesma
 * ideia com `proxima_cobranca`, e por isso serve a mensal e anual sem distinguir
 * uma da outra: quem decide o prazo é a data gravada na ativação.
 *
 * Sem data gravada, o acesso continua liberado. É a escolha segura: assinatura
 * antiga, criada antes desta coluna existir, não pode ser cortada por causa de
 * um campo que ninguém preencheu.
 */
export function assinaturaVencida(
  assinatura: Pick<Assinatura, "status" | "proxima_cobranca">,
): boolean {
  if (assinatura.status !== "ativa" || !assinatura.proxima_cobranca) {
    return false;
  }
  return new Date(assinatura.proxima_cobranca) < new Date();
}

/** true quando a empresa pode usar o app normalmente (trial em dia ou assinatura paga e vigente). */
export function acessoLiberado(
  assinatura: Pick<Assinatura, "status" | "trial_fim" | "proxima_cobranca">,
): boolean {
  if (assinatura.status === "ativa") return !assinaturaVencida(assinatura);
  if (assinatura.status === "trial") return !trialVencido(assinatura);
  // 'pendente' cai aqui: escolheu plano pago e ainda não pagou, então não
  // tem acesso — o gate do middleware manda pro checkout.
  return false;
}

/**
 * Quantos dias de acesso ainda restam, ou null quando não há prazo definido.
 *
 * Serve para a tela dizer "faltam 312 dias" sem ninguém calcular na mão, e para
 * o painel admin mostrar quem está perto de vencer.
 */
export function diasRestantes(
  assinatura: Pick<Assinatura, "status" | "trial_fim" | "proxima_cobranca">,
): number | null {
  const fim =
    assinatura.status === "trial"
      ? assinatura.trial_fim
      : assinatura.status === "ativa"
        ? assinatura.proxima_cobranca
        : null;

  if (!fim) return null;

  const MS_POR_DIA = 24 * 60 * 60 * 1000;
  // Arredonda para cima: no último dia ainda resta 1, não 0.
  return Math.ceil((new Date(fim).getTime() - Date.now()) / MS_POR_DIA);
}

/**
 * Ativa a assinatura depois de um pagamento aprovado.
 *
 * A periodicidade decide quando a próxima cobrança cai. Era `+1 mês` fixo, e
 * quem pagasse o ano adiantado ficava com renovação marcada para daqui a trinta
 * dias: o gate de assinatura passaria a cobrar de novo de quem já pagou.
 *
 * O padrão é mensal porque é o que o checkout próprio vende hoje. Venda anual
 * chega por fora (link externo ou combinada na mão) e informa explicitamente.
 */
export async function ativarAssinatura(
  supabase: Supabase,
  assinaturaId: string,
  periodicidade: Periodicidade = "mensal",
) {
  return supabase
    .from("assinaturas")
    .update({
      status: "ativa",
      periodicidade,
      proxima_cobranca: proximaCobrancaDe(periodicidade).toISOString(),
    })
    .eq("id", assinaturaId);
}
