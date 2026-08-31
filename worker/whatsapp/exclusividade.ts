import { mkdirSync, readFileSync, writeFileSync, openSync, closeSync, unlinkSync } from "node:fs";
import { join } from "node:path";

/*
 * Só uma cópia do worker fala com o WhatsApp por vez.
 *
 * POR QUE ISTO PRECISA EXISTIR. Hospedagem gerenciada roda o app em mais de um
 * processo — para aproveitar mais de um núcleo, e para não haver janela sem
 * ninguém atendendo durante um deploy. Para um servidor HTTP isso é bom: os
 * processos são intercambiáveis. Para o WhatsApp é fatal: a sessão pertence a
 * UMA conexão, e quando a segunda entra com as mesmas credenciais o WhatsApp
 * derruba a primeira (código 440). A primeira reconecta e derruba a segunda. E
 * assim para sempre.
 *
 * O sintoma observado em produção: conectado → reconectando a cada três
 * segundos, indefinidamente, e nenhuma mensagem entregue — porque a conexão
 * nunca dura o bastante para receber uma.
 *
 * A trava é um arquivo na pasta da sessão, criado em modo exclusivo. Fica ali e
 * não num banco de propósito: a pasta da sessão já é o recurso disputado, então
 * quem enxerga a mesma pasta é exatamente quem precisa se coordenar.
 *
 * NÃO É EXCLUSÃO MÚTUA PERFEITA, e não precisa ser. Duas cópias que subam no
 * mesmo milissegundo podem passar as duas; o WhatsApp resolveria isso com um
 * 440 e a perdedora sairia no próximo ciclo. O que a trava elimina é o caso
 * real: processos que sobem com segundos de diferença e brigam por horas.
 */

const NOME = "worker.lock";

/*
 * De quanto em quanto tempo o dono avisa que continua vivo, e a partir de
 * quando o silêncio conta como abandono.
 *
 * A folga entre os dois é o que impede um roubo indevido: uma pausa de coleta
 * de lixo, ou um servidor sobrecarregado, atrasa o aviso sem que ninguém tenha
 * morrido. Três batidas perdidas é tolerância suficiente para isso e curta o
 * bastante para uma cópia morta não bloquear o canal por muito tempo.
 */
const INTERVALO_MS = 10_000;
const ABANDONO_MS = 35_000;

interface Conteudo {
  pid: number;
  desde: string;
  batida: number;
  /*
   * O que a cópia DONA viu chegar.
   *
   * Vai junto com o sinal de vida porque quem responde HTTP quase nunca é
   * quem está conectado — e olhar os contadores da cópia errada mostra zeros,
   * que é indistinguível de "nada chegou". Levou uma investigação inteira até
   * eu perceber que estava lendo o processo errado.
   */
  contadores?: unknown;
}

function caminho(pastaDaSessao: string): string {
  return join(pastaDaSessao, NOME);
}

function ler(arquivo: string): Conteudo | null {
  try {
    return JSON.parse(readFileSync(arquivo, "utf8")) as Conteudo;
  } catch {
    // Inexistente, ou escrito pela metade por uma cópia que morreu no meio.
    // Nos dois casos, tratar como livre: um arquivo corrompido não pode
    // bloquear o canal para sempre.
    return null;
  }
}

function escrever(arquivo: string, dados: Conteudo) {
  writeFileSync(arquivo, JSON.stringify(dados), "utf8");
}

/**
 * Tenta virar a cópia responsável pela conexão.
 *
 * Devolve `null` quando outra cópia viva já é responsável.
 */
export function tentarAssumir(
  pastaDaSessao: string,
  /** Consultado a cada sinal de vida, para publicar o que só a dona enxerga. */
  lerContadores?: () => unknown,
): Trava | null {
  mkdirSync(pastaDaSessao, { recursive: true });
  const arquivo = caminho(pastaDaSessao);

  const dono = ler(arquivo);
  const agora = Date.now();

  // Alguém vivo está com a trava. Exceção: nós mesmos, depois de um reinício em
  // que o processo anterior tinha o mesmo pid — raro, mas deixaria o worker
  // travado esperando por si próprio.
  if (dono && agora - dono.batida < ABANDONO_MS && dono.pid !== process.pid) {
    return null;
  }

  /*
   * Criação exclusiva: `wx` falha se o arquivo já existir, e é o que fecha a
   * corrida entre duas cópias que leram "livre" no mesmo instante.
   */
  try {
    closeSync(openSync(arquivo, "wx"));
  } catch {
    /*
     * O arquivo existe. Isso NÃO significa que há dono — pode ser trava
     * abandonada por uma cópia morta, ou escrita pela metade por uma que
     * morreu no meio.
     *
     * Tratar "existe" como "ocupado" era o defeito: um arquivo corrompido
     * deixava o WhatsApp mudo para sempre, e o conserto seria alguém entrar no
     * servidor e apagar um arquivo — sem nenhuma pista de que é isso. Pego por
     * teste, não por leitura.
     *
     * Então relemos: só desiste se houver dono VIVO. Reler aqui também fecha a
     * janela em que outra cópia criou o arquivo entre a primeira leitura e esta
     * tentativa.
     */
    const agoraDono = ler(arquivo);
    if (agoraDono && Date.now() - agoraDono.batida < ABANDONO_MS && agoraDono.pid !== process.pid) {
      return null;
    }
    // Abandonada ou corrompida: assumimos sobrescrevendo.
  }

  escrever(arquivo, { pid: process.pid, desde: new Date().toISOString(), batida: agora });
  return new Trava(arquivo, lerContadores);
}

export class Trava {
  private batendo: NodeJS.Timeout;

  constructor(
    private readonly arquivo: string,
    private readonly lerContadores?: () => unknown,
  ) {
    this.batendo = setInterval(() => {
      try {
        escrever(this.arquivo, {
          pid: process.pid,
          desde: new Date().toISOString(),
          batida: Date.now(),
          contadores: this.lerContadores?.(),
        });
      } catch {
        // Disco cheio ou pasta removida. Não derruba o worker: a conexão com o
        // WhatsApp continua valendo, e no pior caso outra cópia assume daqui a
        // 35 segundos — o que é melhor do que matar quem está atendendo.
      }
    }, INTERVALO_MS);

    // Não segura o processo vivo só por causa do intervalo.
    this.batendo.unref?.();
  }

  soltar() {
    clearInterval(this.batendo);
    try {
      unlinkSync(this.arquivo);
    } catch {
      // Já removida, ou sem permissão. A trava expira sozinha em 35s.
    }
  }
}

/**
 * Quem é o dono agora, para a página de estado poder dizer.
 *
 * Sem isto, uma cópia em espera responderia "conectando" para sempre e alguém
 * passaria a tarde procurando defeito onde não há.
 */
export function donoAtual(
  pastaDaSessao: string,
): { pid: number; desde: string; contadores?: unknown } | null {
  const dono = ler(caminho(pastaDaSessao));
  if (!dono) return null;
  if (Date.now() - dono.batida >= ABANDONO_MS) return null;
  return { pid: dono.pid, desde: dono.desde, contadores: dono.contadores };
}

export const ESPERA_ENTRE_TENTATIVAS_MS = 15_000;
