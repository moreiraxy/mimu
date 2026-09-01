import { assinaturaEncerrada, planoEfetivo } from "@/lib/assinatura";
import { modulosLiberados } from "@/lib/planos";
import { cotaDaMimu } from "@/lib/mimu/cota";
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

export type MotivoSemAcesso =
  | "suspensa"
  | "assinatura_encerrada"
  | "sem_modulo_ia"
  | "cota_esgotada";

export type Acesso =
  | { liberado: true }
  | { liberado: false; motivo: MotivoSemAcesso };

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

  /*
   * Conta encerrada não conversa, mesmo que o gratuito conversasse.
   *
   * Vem antes do teto de módulos porque não É um teto de módulos: 'cancelada',
   * 'pendente' e 'vencida' são as três que o middleware manda para fora do app
   * inteiro, e o WhatsApp precisa parar no mesmo lugar. Ver
   * `assinaturaEncerrada` em lib/assinatura.ts para a diferença entre isto e
   * um vencimento comum, que vira plano gratuito.
   */
  if (assinaturaEncerrada(assinatura)) {
    return { liberado: false, motivo: "assinatura_encerrada" };
  }

  // O plano EFETIVO: uma assinatura fora do prazo guarda o plano que a pessoa
  // deixou de pagar, e nem o teto de módulos nem o de mensagens podem
  // acreditar nele.
  const plano = planoEfetivo(assinatura);

  const modulos = modulosLiberados(
    plano,
    (data.modulos_ativos ?? []) as ModuloAtivo[],
  );

  if (!modulos.includes("ia")) {
    return { liberado: false, motivo: "sem_modulo_ia" };
  }

  /*
   * A cota do dia, e ela vem por último de propósito.
   *
   * Suspensão e módulo desligado são estados da conta: valem enquanto
   * valerem, e a pessoa precisa saber deles antes de qualquer outra coisa. A
   * cota é passageira — esgota e volta — e dizer "acabaram suas mensagens de
   * hoje" para uma conta suspensa seria informação inútil sobre um recurso
   * que ela não tem de qualquer forma.
   *
   * Só conta, não consome. Quem consome é `consumirMensagemDaMimu`, chamada
   * por quem vai de fato falar com o modelo — este gate também roda em
   * caminhos que terminam sem resposta nenhuma.
   */
  const cota = await cotaDaMimu(plano, empresaId);
  if (cota.esgotada) {
    return { liberado: false, motivo: "cota_esgotada" };
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
export const RESPOSTA_SEM_ACESSO: Record<MotivoSemAcesso, string> = {
  suspensa:
    "Sua conta está pausada no momento, então não consigo te ajudar por aqui. " +
    "Fala com a gente que a gente resolve. 💚",
  /*
   * Este caso mudou de significado.
   *
   * Antes queria dizer "seu plano não inclui a Mimu", porque o gratuito não
   * incluía. Agora todo plano inclui, e a única forma de cair aqui é a pessoa
   * ter DESLIGADO a assistente nos módulos. A mensagem antiga mandaria alguém
   * pagar por algo que ela já tem e desligou sozinha.
   */
  assinatura_encerrada:
    "Sua assinatura não está ativa, então não consigo te atender por aqui. 💚\n\n" +
    "É só resolver em *Perfil* → *Assinatura* no app que eu volto a responder.",
  sem_modulo_ia:
    "A assistente está desligada na sua conta. Para ligar de volta é em " +
    "*Perfil* → *Perfil do negócio* no app. 💚",
  cota_esgotada:
    "Por hoje é só! Você já usou suas mensagens de hoje comigo. 💚\n\n" +
    "Amanhã a conta zera e a gente continua — e o app segue aberto do jeito de " +
    "sempre para registrar e consultar. Se quiser falar comigo mais vezes por " +
    "dia, dá uma olhada em *Perfil* → *Assinatura*.",
};

/**
 * As mesmas recusas, ditas DENTRO do app.
 *
 * Duas diferenças, e nenhuma é estética. Os asteriscos do WhatsApp são
 * negrito lá e são asteriscos aqui — o texto sairia literalmente com
 * `*Perfil*` na tela. E mandar alguém "abrir o app" para quem já está com o
 * app aberto é a frase que faz um produto parecer que não sabe onde está.
 */
export const RESPOSTA_SEM_ACESSO_NO_APP: Record<MotivoSemAcesso, string> = {
  suspensa:
    "Sua conta está pausada no momento. Fala com a gente pelo suporte que a gente resolve.",
  assinatura_encerrada:
    "Sua assinatura não está ativa. Resolva em Perfil → Assinatura para voltar a falar comigo.",
  sem_modulo_ia:
    "A assistente está desligada na sua conta. Para ligar de volta, vá em Perfil → Perfil do negócio.",
  cota_esgotada:
    "Por hoje é só! Você já usou suas mensagens de hoje comigo. Amanhã a conta zera e a gente continua — o app segue aberto para registrar e consultar.",
};
