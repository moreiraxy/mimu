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

  await supabase
    .from("auth_rate_limit")
    .insert({ tipo, identificador: identificadorNormalizado });

  const umDiaAtras = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase.from("auth_rate_limit").delete().lt("created_at", umDiaAtras);
}
