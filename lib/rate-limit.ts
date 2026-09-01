import { createServiceClient } from "@/lib/supabase/service";
import { inicioDoDiaNoBrasil } from "@/lib/datas";

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
  /**
   * A cota diária da Mimu, por EMPRESA.
   *
   * Por empresa e não por usuária porque é a conta que tem plano, e é o plano
   * que compra a cota. Vale somando app e WhatsApp: é a mesma pessoa gastando
   * a mesma API dos dois lados.
   *
   * O `max` aqui é o do plano gratuito e serve de piso seguro. Quem chama
   * passa o teto do plano por parâmetro — ver `limiteDiarioDaMimu` em
   * lib/planos.ts. Deixar o número certo aqui seria impossível: ele depende de
   * quem está perguntando.
   *
   * `porDiaCivil` é o que torna a promessa verdadeira. Este teto é o ÚNICO que
   * a pessoa lê na tela: "10 mensagens por dia" está escrito no perfil, no
   * plano e na resposta da Mimu quando acaba. Os outros tetos daqui são
   * proteções internas contra abuso, e ninguém precisa saber quando eles
   * zeram.
   *
   * Uma janela de 24 horas corridas contaria certo e comunicaria errado: quem
   * gastasse as dez às 15h veria as mensagens voltando de uma em uma a partir
   * das 15h do dia seguinte, sem nada na tela explicando por quê. "Por dia" só
   * quer dizer uma coisa para quem lê, e é esta: amanhã tem dez de novo.
   *
   * `janelaMs` fica porque a limpeza de `registrarTentativa` usa 24h, e um dia
   * civil nunca é mais longo que isso — nenhuma linha de hoje é apagada por
   * ela.
   */
  mimu_dia: { max: 10, janelaMs: 24 * 60 * 60 * 1000, porDiaCivil: true },
} as const;

/**
 * A partir de quando este teto conta.
 *
 * Ou a meia-noite do dia no Brasil (para o que a pessoa lê como "por dia"), ou
 * uma janela deslizante a partir de agora (para as proteções internas).
 */
function inicioDaJanela(tipo: TipoRateLimit): Date {
  const limite = LIMITES[tipo];
  return "porDiaCivil" in limite && limite.porDiaCivil
    ? inicioDoDiaNoBrasil()
    : new Date(Date.now() - limite.janelaMs);
}

export type TipoRateLimit = keyof typeof LIMITES;

/**
 * Quantas vezes `identificador` já apareceu dentro da janela deste tipo.
 *
 * Existe separado de `excedeuLimite` porque há um caso em que o booleano não
 * basta: a tela precisa dizer "3 de 10 mensagens usadas hoje", e para isso
 * precisa do número, não da resposta.
 */
export async function usoNaJanela(
  tipo: TipoRateLimit,
  identificador: string,
): Promise<number> {
  const supabase = createServiceClient();
  const desde = inicioDaJanela(tipo).toISOString();

  const { count } = await supabase
    .from("auth_rate_limit")
    .select("*", { count: "exact", head: true })
    .eq("tipo", tipo)
    .eq("identificador", identificador.toLowerCase())
    .gte("created_at", desde);

  return count ?? 0;
}

/**
 * true se `identificador` (e-mail, IP ou id de empresa) já bateu o limite na
 * janela do tipo.
 *
 * `maximo` sobrescreve o teto da tabela, e existe para a cota da Mimu: lá o
 * limite depende do PLANO de quem está perguntando, e um número fixo em
 * LIMITES não teria como saber disso.
 */
export async function excedeuLimite(
  tipo: TipoRateLimit,
  identificador: string,
  maximo?: number,
): Promise<boolean> {
  const usadas = await usoNaJanela(tipo, identificador);
  return usadas >= (maximo ?? LIMITES[tipo].max);
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
