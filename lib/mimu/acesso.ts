import { planoEfetivo } from "@/lib/assinatura";
import { modulosLiberados } from "@/lib/planos";
import type { ClientComIdentidade } from "@/lib/supabase/identidade";
import type { ModuloAtivo } from "@/types";

/**
 * A conta pode usar a Mimu agora?
 *
 * Existe porque o WhatsApp NÃO passa pelo middleware, e o middleware era o
 * único lugar que respondia essa pergunta. O resultado eram duas portas
 * abertas que ninguém veria de fora:
 *
 * Uma conta suspensa pelo painel continuava conversando pelo WhatsApp, mesmo
 * sem conseguir abrir o app.
 *
 * E uma conta no plano gratuito usava a IA à vontade por lá. O plano gratuito
 * não inclui `ia` justamente porque cada resposta custa na Groq — a regra
 * estava escrita, aplicada no app, e contornável por mensagem.
 *
 * As duas checagens usam as MESMAS funções que o middleware
 * (`planoEfetivo`, `modulosLiberados`), e não uma reimplementação. Uma segunda
 * cópia divergiria da primeira no dia em que alguém mexesse numa só, e o canal
 * esquecido viraria a porta destrancada de novo.
 */

export type Acesso =
  | { liberado: true }
  | { liberado: false; motivo: "suspensa" | "sem_modulo_ia" };

export async function verificarAcesso(
  supabase: ClientComIdentidade,
  empresaId: string,
): Promise<Acesso> {
  const { data } = await supabase
    .from("empresas")
    .select("suspensa_em, modulos_ativos, assinaturas(status, plano, trial_fim, proxima_cobranca)")
    .eq("id", empresaId)
    .maybeSingle();

  if (!data) return { liberado: false, motivo: "suspensa" };

  /*
   * Suspensão vem primeiro, e não respeita plano nenhum.
   *
   * É a mesma ordem do middleware: quem foi tirada da plataforma não contorna
   * a suspensão por outro caminho. Resolver suspensão é conversa com o
   * suporte, não é pagar.
   */
  if (data.suspensa_em) return { liberado: false, motivo: "suspensa" };

  const assinatura = Array.isArray(data.assinaturas)
    ? (data.assinaturas[0] ?? null)
    : (data.assinaturas ?? null);

  const modulos = modulosLiberados(
    // O plano EFETIVO: uma linha 'pendente' guarda o plano que a pessoa
    // escolheu e nunca pagou, e o teto não pode acreditar nela.
    planoEfetivo(assinatura),
    (data.modulos_ativos ?? []) as ModuloAtivo[],
  );

  if (!modulos.includes("ia")) {
    return { liberado: false, motivo: "sem_modulo_ia" };
  }

  return { liberado: true };
}

/**
 * O que dizer em cada caso.
 *
 * Falar do plano aqui é permitido e não conflita com a App Store: a regra
 * dela vale para o que aparece DENTRO do app, e a própria diretriz diz que
 * comunicação fora do app sobre formas de pagamento é livre.
 */
export const RESPOSTA_SEM_ACESSO: Record<"suspensa" | "sem_modulo_ia", string> = {
  suspensa:
    "Sua conta está pausada no momento, então não consigo te ajudar por aqui. " +
    "Fala com a gente que a gente resolve. 💚",
  sem_modulo_ia:
    "Conversar comigo faz parte do plano pago. No plano grátis você continua " +
    "registrando suas vendas e vendo seu faturamento pelo app, sempre. " +
    "Se quiser me ter por aqui, é só dar uma olhada em *Minha empresa* no app. 💚",
};
