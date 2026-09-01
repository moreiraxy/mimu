import { limiteDiarioDaMimu } from "@/lib/planos";
import { registrarTentativa, usoNaJanela } from "@/lib/rate-limit";

/**
 * Quantas mensagens da Mimu a conta já gastou hoje, e quantas ainda tem.
 *
 * "Hoje" é o dia civil no Brasil, e não as últimas 24 horas — ver
 * `inicioDoDiaNoBrasil` em lib/datas.ts. O produto promete "10 mensagens por
 * dia" em três telas diferentes, e por dia só quer dizer uma coisa para quem
 * lê: amanhã tem dez de novo.
 *
 * ESTE ARQUIVO EXISTE PARA SER O ÚNICO. A Mimu responde por dois caminhos —
 * a tela de chat e o WhatsApp — e os dois precisam contar a mesma coisa. Duas
 * implementações se pareceriam por um tempo e depois divergiriam no dia em
 * que alguém mexesse numa só; o canal esquecido viraria a porta por onde a
 * cota não conta. É a mesma razão pela qual lib/mimu/acesso.ts reaproveita as
 * funções do middleware em vez de reescrevê-las.
 *
 * A contagem é por EMPRESA. Plano é da conta, não da pessoa, e o teto que se
 * compra é o da conta.
 */

export interface Cota {
  /** Quantas mensagens a Mimu respondeu HOJE — a conta zera na virada do dia. */
  usadas: number;
  /** Quantas o plano permite por dia. */
  limite: number;
  /** Nunca negativo: a tela mostra "0 restantes", não "-3". */
  restantes: number;
  esgotada: boolean;
}

export async function cotaDaMimu(
  plano: string | null | undefined,
  empresaId: string,
): Promise<Cota> {
  const limite = limiteDiarioDaMimu(plano);
  const usadas = await usoNaJanela("mimu_dia", empresaId);

  return {
    usadas,
    limite,
    restantes: Math.max(0, limite - usadas),
    esgotada: usadas >= limite,
  };
}

/**
 * Marca uma mensagem como gasta.
 *
 * Chamada DEPOIS de a cota ser conferida e ANTES de falar com o modelo — que
 * é onde está o custo. Marcar depois da resposta deixaria uma janela em que
 * duas mensagens simultâneas passariam as duas; marcar antes de conferir
 * cobraria de quem foi barrada.
 *
 * Não devolve nada e não lança: `registrarTentativa` engole falha de gravação
 * de propósito, porque um erro no contador não pode derrubar a resposta da
 * Mimu na mão de quem está atendendo um cliente no balcão. O preço desse
 * desenho é que uma falha de banco solta uma mensagem de graça — e é por isso
 * que a constraint do banco (migration 20260831210000) importa: sem ela, TODA
 * mensagem seria de graça, em silêncio.
 */
export async function consumirMensagemDaMimu(empresaId: string): Promise<void> {
  await registrarTentativa("mimu_dia", empresaId);
}
