import { createServiceClient } from "@/lib/supabase/service";

const LIMITES = {
  login: { max: 10, janelaMs: 60 * 60 * 1000 },
  cadastro: { max: 5, janelaMs: 60 * 60 * 1000 },
  /**
   * Chat da Mimu, por usuária. Cada mensagem custa DUAS chamadas ao Groq
   * (classificação de intenção + resposta), então sem teto uma conta logada
   * consumiria a cota da API em laço.
   *
   * 60/hora é folgado pra uso real — quem atende no balcão manda algumas
   * mensagens por vez, não uma por minuto durante uma hora inteira — e ainda
   * assim corta o abuso automatizado.
   */
  chat_ia: { max: 60, janelaMs: 60 * 60 * 1000 },
  /**
   * Recuperação de senha, por e-mail pedido.
   *
   * Não tinha teto nenhum, e cada pedido manda uma mensagem. Além do incômodo
   * para quem recebe, o SMTP é um Gmail com cerca de 500 envios por dia:
   * esgotar a cota derruba junto a confirmação de cadastro de todo mundo.
   *
   * Três por hora cobre quem não achou o e-mail e pediu de novo, e não cobre
   * quem está rodando um script.
   */
  recuperar_senha: { max: 3, janelaMs: 60 * 60 * 1000 },
  /**
   * Tentativas de confirmar um código de vínculo do WhatsApp, por número.
   *
   * É o único ponto do produto onde alguém sem sessão pode se ligar a uma
   * conta. O código é curto de propósito (a pessoa digita no celular), e o que
   * o torna inviável de adivinhar não é só o tamanho — é isto aqui. Sem teto,
   * um número chutando códigos em laço acharia um pendente e passaria a
   * enxergar o negócio de outra pessoa.
   *
   * 5 por hora é folgado para quem errou de digitar e apertado para quem está
   * chutando.
   */
  whatsapp_vinculo: { max: 5, janelaMs: 60 * 60 * 1000 },
} as const;

export type TipoRateLimit = keyof typeof LIMITES;

/** true se `identificador` (e-mail ou IP) já bateu o limite de tentativas na última hora. */
export async function excedeuLimite(
  tipo: TipoRateLimit,
  identificador: string,
): Promise<boolean> {
  const supabase = createServiceClient();
  const { max, janelaMs } = LIMITES[tipo];
  const desde = new Date(Date.now() - janelaMs).toISOString();

  const { count } = await supabase
    .from("auth_rate_limit")
    .select("*", { count: "exact", head: true })
    .eq("tipo", tipo)
    .eq("identificador", identificador.toLowerCase())
    .gte("created_at", desde);

  return (count ?? 0) >= max;
}

/**
 * Registra uma tentativa (chamar só quando `excedeuLimite` já deu false, pra
 * não contar tentativas que nem chegaram a rodar) e aproveita pra limpar
 * tentativas com mais de 24h — sem isso a tabela cresce pra sempre, e não
 * há cron configurado neste projeto.
 */
export async function registrarTentativa(
  tipo: TipoRateLimit,
  identificador: string,
): Promise<void> {
  const supabase = createServiceClient();
  const identificadorNormalizado = identificador.toLowerCase();

  const { error } = await supabase
    .from("auth_rate_limit")
    .insert({ tipo, identificador: identificadorNormalizado });

  // Se a gravação falha, o limite deixa de contar e o teto some sem ninguém
  // notar. Era um erro engolido: a coluna `tipo` tem check no banco, e um tipo
  // novo esquecido ali desligaria a proteção em silêncio.
  if (error) {
    console.error("Falha ao registrar tentativa de rate limit.", tipo, error.message);
  }

  const umDiaAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("auth_rate_limit").delete().lt("created_at", umDiaAtras);
}
