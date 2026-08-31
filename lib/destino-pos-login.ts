import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

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
  /**
   * true quando o login veio de dentro do app iOS. Decide se o destino de
   * cobrança pode ser o checkout próprio ou não — ver o bloco mais abaixo.
   */
  ehApp = false,
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

  /*
   * No app iOS ninguém é mandado para o checkout próprio.
   *
   * /assinar e /trial-vencido são as telas do Mercado Pago, e a diretriz 3.1.1
   * da Apple não distingue "a pessoa clicou" de "o sistema mandou": levar até
   * lá por redirect é a mesma reprovação que um botão de compra. Dentro do app
   * quem cobra é a Apple, e o caminho de assinar é o IAP.
   *
   * O middleware bloqueia essas rotas de novo, por garantia. Aqui é para não
   * fazer a viagem: mandar para uma tela que vai ser rebatida deixa um piscar
   * feio logo depois do login.
   */
  const destinoDeCobranca = ehApp ? "/dashboard" : "/assinar";

  if (!assinatura || assinatura.status === "pendente") return destinoDeCobranca;

  /*
   * Cancelada continua indo para o checkout: é decisão da pessoa (ou estorno),
   * e não um prazo que passou.
   *
   * Trial vencido e assinatura vencida saíram daqui. Quem chega nesse estado
   * agora CAI PARA O PLANO GRATUITO, e quem faz esse rebaixamento é o
   * middleware, na primeira navegação. Mandar para /trial-vencido antes disso
   * mostraria uma parede que já não existe — e pior, mostraria a parede e
   * depois deixaria entrar, que é a pior das duas mensagens.
   */
  if (assinatura.status === "cancelada") return destinoDeCobranca;

  return "/dashboard";
}
