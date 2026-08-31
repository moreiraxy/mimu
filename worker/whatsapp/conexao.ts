import makeWASocket, {
  DisconnectReason,
  downloadMediaMessage,
  type WAMessage,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  type WASocket,
} from "baileys";
import type { Boom } from "@hapi/boom";
import type { Atendente, MensagemRecebida } from "@/lib/canais/tipos";
import { mascararRemetente } from "@/lib/canais/tipos";

/**
 * A conexão com o WhatsApp, via Baileys.
 *
 * Este é o ÚNICO arquivo do projeto que sabe o que é WhatsApp. Ele traduz o
 * que chega para `MensagemRecebida` e entrega o que sai — o resto da Mimu
 * conversa pelo contrato de lib/canais/tipos.ts. Trocar pela API oficial da
 * Meta é reescrever este arquivo, e só ele.
 *
 * PERFIL DE RISCO. O Baileys opera fora dos termos da Meta. O nosso uso é do
 * tipo que não costuma ser perseguido — só respondemos a quem escreveu
 * primeiro, todo mundo vinculou a conta de propósito dentro do app, e não
 * existe disparo frio. As mitigações que dependem de código estão aqui: só
 * responder, nunca iniciar; atraso variável antes de cada resposta; uma
 * conversa por vez.
 */

/** Onde a sessão fica. Trocar de número é apontar para outra pasta. */
export interface OpcoesConexao {
  pastaDaSessao: string;
  atender: Atendente;
  /** Chamado quando o estado muda, para o operador saber que caiu. */
  aoMudarEstado?: (estado: EstadoConexao, detalhe?: string) => void;
  /**
   * Contadores do que o WhatsApp entregou, para a página de estado mostrar.
   *
   * Existe porque "conectado e mudo" é indistinguível de "conectado e ninguém
   * escreveu" — e a diferença entre as duas é o que decide onde procurar o
   * defeito. Sem isto, a investigação começa por adivinhação.
   */
  contadores?: Contadores;
}

export interface Contadores {
  /** Lotes que o WhatsApp entregou, de qualquer tipo. */
  lotes: number;
  /** Mensagens dentro desses lotes, antes de qualquer filtro. */
  brutas: number;
  /** As que passaram pelos filtros e foram para o atendimento. */
  aceitas: number;
  /** Por que as outras foram descartadas. */
  descartes: Record<string, number>;
}

export type EstadoConexao =
  | "conectando"
  | "aguardando_leitura_do_qr"
  | "conectado"
  | "reconectando"
  | "desconectado_precisa_parear";

/**
 * Quanto esperar antes de responder.
 *
 * Duas razões, e as duas importam. A primeira é operacional: resposta
 * instantânea a toda mensagem é o padrão que denuncia automação. A segunda é
 * de produto — resposta instantânea assusta, e a Mimu fala como uma amiga,
 * não como um sistema. Amiga demora alguns segundos para responder.
 */
function atrasoDeResposta(): number {
  return 2000 + Math.random() * 3000;
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Cala o log interno do Baileys, deixando passar só erro.
 *
 * A biblioteca escreve em pino no nível `info`, e cada handshake vira várias
 * linhas de JSON com chave criptográfica dentro. Isso enterra o nosso log
 * operacional — que é justamente o que a seção 4.7 do brief pede para existir
 * — e ainda joga material sensível no stdout, que vai para o painel de logs da
 * hospedagem e fica lá.
 *
 * `error` e `fatal` passam: quando o Baileys tem algo a dizer sobre a conexão
 * cair, a gente quer ouvir.
 */
function loggerSilencioso() {
  const nada = () => {};
  const logger = {
    level: "error",
    trace: nada,
    debug: nada,
    info: nada,
    warn: nada,
    error: (...args: unknown[]) => console.error("[baileys]", ...args),
    fatal: (...args: unknown[]) => console.error("[baileys]", ...args),
    child: () => logger,
  };
  return logger;
}

/**
 * O texto de uma mensagem escrita, ou null se ela não for escrita.
 */
function extrairTexto(mensagem: {
  conversation?: string | null;
  extendedTextMessage?: { text?: string | null } | null;
}): string | null {
  const texto =
    mensagem.conversation ?? mensagem.extendedTextMessage?.text ?? null;
  return texto && texto.trim().length > 0 ? texto.trim() : null;
}

/**
 * true quando a mensagem é de voz.
 *
 * `audioMessage` cobre tanto o áudio gravado no microfone quanto o arquivo de
 * áudio anexado — para a Mimu os dois são a mesma coisa: alguém falando.
 */
function ehAudio(mensagem: { audioMessage?: unknown }): boolean {
  return Boolean(mensagem.audioMessage);
}

/**
 * Baixa os bytes do áudio, sob demanda.
 *
 * Devolvido como função e não executado aqui: quem decide se vale a pena
 * baixar é o atendimento, depois de confirmar que o número pertence a alguém.
 * Baixar tudo que chega gastaria banda e transcrição com número errado e spam.
 */
function baixadorDeAudio(bruta: WAMessage): () => Promise<Buffer> {
  return () =>
    downloadMediaMessage(bruta, "buffer", {}) as Promise<Buffer>;
}

export interface Conexao {
  parar: () => Promise<void>;
}

export async function conectar(opcoes: OpcoesConexao): Promise<Conexao> {
  const { state, saveCreds } = await useMultiFileAuthState(opcoes.pastaDaSessao);
  const { version } = await fetchLatestBaileysVersion();

  let socket: WASocket | null = null;
  let parando = false;

  /*
   * Uma mensagem por vez.
   *
   * A fila é uma promessa encadeada, e não um array com worker: o volume aqui
   * é de pessoas digitando, não de sistema. O que ela garante é que duas
   * mensagens da mesma pessoa não sejam processadas em paralelo — o que faria
   * a segunda ler o estado do negócio antes de a primeira ter gravado, e a
   * Mimu responder coisas que se contradizem.
   *
   * Também é o que impede um pico de derrubar tudo: cem mensagens viram cem
   * respostas em fila, não cem chamadas simultâneas ao Groq.
   */
  let fila: Promise<void> = Promise.resolve();

  function enfileirar(tarefa: () => Promise<void>) {
    fila = fila.then(tarefa).catch((erro) => {
      // Um erro numa mensagem não pode parar a fila das seguintes.
      console.error("[whatsapp] falha ao processar mensagem:", erro);
    });
  }

  /**
   * Entrega a resposta, insistindo se a rede falhar.
   *
   * É o ponto do fluxo onde perder dói mais: neste momento a resposta já foi
   * calculada, a mensagem já está marcada como recebida (a idempotência
   * impede reprocessar) e, se era um registro, a venda JÁ FOI GRAVADA. Uma
   * falha de rede aqui deixaria a pessoa sem o recibo de algo que aconteceu —
   * e sem o recibo ela não sabe que pode responder "desfazer".
   *
   * Três tentativas com espera crescente. Falha de socket do WhatsApp costuma
   * ser instantânea e passageira (reconexão em curso); esperar um pouco entre
   * as tentativas cobre justamente esse caso, sem virar insistência que a Meta
   * leia como abuso.
   */
  async function enviarComTentativas(
    destino: string,
    texto: string,
  ): Promise<void> {
    const ESPERAS = [1000, 3000, 8000];

    for (let tentativa = 0; tentativa < ESPERAS.length; tentativa++) {
      try {
        await socket!.sendMessage(destino, { text: texto });
        return;
      } catch (erro) {
        const ultima = tentativa === ESPERAS.length - 1;
        console.error(
          `[whatsapp] falhei ao enviar (tentativa ${tentativa + 1}/${ESPERAS.length})`,
          ultima ? erro : "",
        );
        if (ultima) throw erro;
        await esperar(ESPERAS[tentativa]!);
      }
    }
  }

  function iniciarSocket() {
    socket = makeWASocket({
      version,
      auth: state,
      // Ver loggerSilencioso: o padrão despeja JSON com material de handshake
      // no stdout e enterra o log operacional.
      logger: loggerSilencioso() as Parameters<typeof makeWASocket>[0]["logger"],
      // O QR é tratado no connection.update abaixo, para o log ficar sob nosso
      // controle em vez de a biblioteca escrever direto no stdout.
      printQRInTerminal: false,
      // Sem isto o Baileys se anuncia como um navegador genérico. O nome
      // aparece na lista de aparelhos conectados do celular da Mimu, e é o que
      // permite a quem opera reconhecer a sessão certa antes de desconectar.
      browser: ["Mimu", "Chrome", "1.0.0"],
      // Não marcar tudo como visto: o WhatsApp trata leitura em massa como
      // sinal de automação, e a pessoa vê "visto" sem ter sido lido.
      markOnlineOnConnect: false,
    });

    socket.ev.on("creds.update", saveCreds);

    socket.ev.on("connection.update", (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        opcoes.aoMudarEstado?.("aguardando_leitura_do_qr", qr);
      }

      if (connection === "open") {
        opcoes.aoMudarEstado?.("conectado");
      }

      if (connection === "close") {
        const motivo = (lastDisconnect?.error as Boom | undefined)?.output
          ?.statusCode;

        /*
         * `loggedOut` é a única saída definitiva.
         *
         * Significa que alguém desconectou o aparelho pelo celular, ou que o
         * número foi banido. Reconectar em laço nesse caso não recupera nada e
         * ainda vira martelada no servidor da Meta — que é exatamente o
         * comportamento que atrai banimento.
         *
         * Qualquer outro motivo (queda de rede, reinício do servidor deles,
         * conflito de sessão) é temporário e se resolve reconectando.
         */
        if (motivo === DisconnectReason.loggedOut) {
          opcoes.aoMudarEstado?.(
            "desconectado_precisa_parear",
            "A sessão foi encerrada no celular. É preciso ler o QR de novo.",
          );
          return;
        }

        if (parando) return;

        opcoes.aoMudarEstado?.("reconectando", `código ${motivo ?? "?"}`);
        // Espera antes de tentar: reconexão imediata em laço, quando o
        // problema é do outro lado, só multiplica a tentativa.
        setTimeout(iniciarSocket, 3000);
      }
    });

    socket.ev.on("messages.upsert", ({ messages, type }) => {
      const c = opcoes.contadores;
      if (c) {
        c.lotes += 1;
        c.brutas += messages.length;
      }

      const descartar = (motivo: string) => {
        if (c) c.descartes[motivo] = (c.descartes[motivo] ?? 0) + 1;
      };

      // "notify" é mensagem nova de verdade. "append" é histórico sendo
      // sincronizado depois de reconectar — responder a isso faria a Mimu
      // reagir a conversas de dias atrás toda vez que a conexão caísse.
      if (type !== "notify") {
        descartar(`tipo:${type}`);
        return;
      }

      for (const bruta of messages) {
        const remoteJid = bruta.key.remoteJid;
        if (!remoteJid) {
          descartar("sem_remetente");
          continue;
        }

        // Nunca responder a si mesma: geraria laço infinito com o próprio
        // número.
        if (bruta.key.fromMe) {
          descartar("de_mim_mesma");
          continue;
        }

        /*
         * Só conversa de um para um.
         *
         * Grupo (@g.us) e status (status@broadcast) ficam de fora. Num grupo,
         * a Mimu responderia dado financeiro de uma pessoa na frente de
         * outras — e é também o lugar de onde vem denúncia, que é o que leva
         * um número a ser banido.
         */
        if (!remoteJid.endsWith("@s.whatsapp.net")) {
          descartar("nao_e_conversa_direta");
          continue;
        }

        const conteudo = bruta.message ?? {};
        const texto = extrairTexto(conteudo);
        const audio = !texto && ehAudio(conteudo);

        /*
         * Nem texto nem áudio: imagem, figurinha, documento, localização.
         *
         * Segue ignorado em silêncio. A Mimu não sabe ler foto de comanda
         * ainda, e responder "não entendi" a cada figurinha enviada por
         * engano seria barulho.
         */
        if (!texto && !audio) {
          descartar("nem_texto_nem_audio");
          continue;
        }

        const mensagem: MensagemRecebida = {
          canal: "whatsapp",
          idNoCanal: bruta.key.id!,
          remetente: remoteJid.split("@")[0]!,
          // Vazio quando é áudio: o texto nasce da transcrição, e ela só roda
          // depois de o atendimento confirmar o vínculo.
          texto: texto ?? "",
          obterAudio: audio ? baixadorDeAudio(bruta) : undefined,
          recebidaEm: bruta.messageTimestamp
            ? new Date(Number(bruta.messageTimestamp) * 1000)
            : new Date(),
        };

        if (c) c.aceitas += 1;

        enfileirar(async () => {
          const resposta = await opcoes.atender(mensagem);
          if (!resposta) return;

          await esperar(atrasoDeResposta());
          await enviarComTentativas(remoteJid, resposta.texto);

          console.log(
            `[whatsapp] respondi ${mascararRemetente(mensagem.remetente)}`,
          );
        });
      }
    });
  }

  opcoes.aoMudarEstado?.("conectando");
  iniciarSocket();

  return {
    parar: async () => {
      parando = true;
      // Espera a fila esvaziar: derrubar no meio deixaria uma mensagem
      // registrada como recebida e nunca respondida.
      await fila;
      socket?.end(undefined);
    },
  };
}
