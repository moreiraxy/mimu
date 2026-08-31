import { createServer, type Server } from "node:http";
import qrcode from "qrcode-terminal";
import type { EstadoConexao } from "./conexao";
import { donoAtual } from "./exclusividade";
import type { Contadores } from "./conexao";

/*
 * Uma porta HTTP no worker do WhatsApp.
 *
 * Nasceu de duas necessidades que a mesma coisa resolve.
 *
 * A PRIMEIRA é hospedagem. Plataforma de app gerenciado (a Hostinger é uma)
 * espera que todo processo Node responda em HTTP, e derruba o que fica calado
 * achando que travou. O worker não responde nada — ele só mantém um WebSocket
 * aberto com o WhatsApp. Sem esta porta, ele seria morto por parecer morto.
 *
 * A SEGUNDA é saber que ele caiu. Hoje, se a conexão morre às três da manhã, a
 * descoberta vem por uma cliente reclamando no dia seguinte. Com um endereço
 * que responde o estado, qualquer monitor gratuito avisa em minutos.
 *
 * E o QR do pareamento entra aqui de quebra. Ler QR desenhado em log de painel
 * é onde essa tarefa costuma emperrar: o visualizador quebra as linhas e o
 * código fica ilegível. Numa página HTML ele sempre escaneia.
 */

/** O que o worker informa sobre si. Preenchido pelo index conforme o estado muda. */
export interface Situacao {
  estado: EstadoConexao | "subindo" | "em_espera";
  desde: string;
  /** Texto curto explicando o estado. Hoje só a espera usa. */
  detalhe?: string | null;
  /** O que o WhatsApp entregou. Ver o comentário em Contadores. */
  contadores?: Contadores;
  /*
   * O QR só existe enquanto ninguém pareou. Guardado para a página poder
   * mostrá-lo, e apagado assim que a conexão sobe — não é para ficar
   * disponível depois que deixou de ser necessário.
   */
  qr: string | null;
}

/*
 * O QR é credencial, e por isso a página que o mostra é protegida.
 *
 * Quem lê aquele código conecta o WhatsApp DELE ao nosso worker — passa a
 * receber as mensagens que chegariam para a Mimu e a responder no lugar dela.
 * Deixar isso num endereço público seria entregar o canal para quem passar por
 * ali primeiro.
 *
 * Sem token configurado a página simplesmente não existe (404, e não uma
 * mensagem dizendo que existe mas está bloqueada). O pareamento continua
 * possível pelo log, que é o caminho de sempre.
 */
const TOKEN = process.env.WHATSAPP_QR_TOKEN ?? null;

function paginaDoQr(situacao: Situacao): Promise<string> {
  return new Promise((resolve) => {
    if (!situacao.qr) {
      resolve(
        pagina(
          "Nada para parear",
          `<p>Estado atual: <strong>${situacao.estado}</strong>.</p>
           <p>O QR só aparece quando a conexão está esperando pareamento.</p>`,
        ),
      );
      return;
    }

    // O desenho em blocos escaneia bem dentro de <pre>, desde que a altura da
    // linha seja exatamente 1 — com o padrão do navegador, as linhas ficam
    // separadas e o leitor não reconhece o código.
    qrcode.generate(situacao.qr, { small: true }, (desenho: string) => {
      resolve(
        pagina(
          "Parear a Mimu",
          `<p>No celular da Mimu: WhatsApp → Configurações →
              Aparelhos conectados → <strong>Conectar aparelho</strong>.</p>
           <pre>${desenho}</pre>
           <p class="rodape">A página se atualiza sozinha a cada 20 segundos —
              o QR expira e é trocado de tempos em tempos.</p>`,
        ),
      );
    });
  });
}

function pagina(titulo: string, corpo: string): string {
  return `<!doctype html>
<html lang="pt-BR"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="20">
<title>${titulo} — Mimu</title>
<style>
  body { background:#fff; color:#1a1a1a; font:14px/1.6 -apple-system,system-ui,sans-serif;
         margin:0; padding:24px; display:flex; flex-direction:column; align-items:center; }
  h1 { font-size:18px; margin:0 0 12px; }
  pre { font-family:ui-monospace,Menlo,monospace; font-size:9px; line-height:1;
        letter-spacing:0; background:#fff; color:#000; padding:12px; margin:16px 0;
        overflow-x:auto; max-width:100%; }
  .rodape { color:#6b6b6b; font-size:12px; }
</style>
</head><body><h1>${titulo}</h1>${corpo}</body></html>`;
}

/**
 * Sobe a porta HTTP do worker.
 *
 * `situacao` é lido a cada requisição, não copiado: quem chama continua
 * atualizando o mesmo objeto conforme o estado muda.
 */
export function servirSaude(situacao: Situacao, pastaDaSessao: string): Server {
  /*
   * A porta vem da plataforma quando existe.
   *
   * Hospedagem gerenciada escolhe a porta e a informa por PORT — fixar uma
   * faria o app subir escutando onde ninguém está ouvindo, e o sintoma é
   * "aplicação não responde" sem nenhum erro no log.
   */
  const porta = Number(process.env.PORT ?? 8080);

  const servidor = createServer(async (req, res) => {
    const caminho = (req.url ?? "/").split("?")[0];
    const parametros = new URL(req.url ?? "/", "http://localhost").searchParams;

    if (caminho === "/parear") {
      if (!TOKEN || parametros.get("token") !== TOKEN) {
        res.writeHead(404).end("não encontrado");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(await paginaDoQr(situacao));
      return;
    }

    /*
     * A saúde é do CANAL, não deste processo.
     *
     * Com mais de uma cópia rodando, quem responde HTTP pode ser justamente a
     * que está esperando a vez. Olhar só para o próprio estado faria o monitor
     * gritar "fora do ar" com a Mimu atendendo normalmente pela cópia ao lado —
     * e alarme falso repetido é como um alarme deixa de ser levado a sério.
     *
     * Por isso, quando esta cópia não é a responsável, a resposta consulta
     * quem é.
     */
    const dono = situacao.estado === "em_espera" ? donoAtual(pastaDaSessao) : null;
    const canalDePe = situacao.estado === "conectado" || dono !== null;

    const corpo = JSON.stringify({
      servico: "whatsapp",
      estado: situacao.estado,
      desde: situacao.desde,
      ...(situacao.detalhe ? { detalhe: situacao.detalhe } : {}),
      ...(dono ? { conexao_em: `pid ${dono.pid}`, desde_o_dono: dono.desde } : {}),
      /*
       * Os contadores vêm de quem está CONECTADO, não deste processo.
       *
       * Quem responde HTTP quase nunca é quem fala com o WhatsApp. Mostrar os
       * próprios contadores exibiria zeros para sempre — e zero é
       * indistinguível de "nada chegou", que é justamente a pergunta que estes
       * números existem para responder.
       */
      ...(dono?.contadores
        ? { recebido: dono.contadores }
        : situacao.contadores
          ? { recebido: situacao.contadores }
          : {}),
    });

    /*
     * Dois endereços, com códigos diferentes de propósito.
     *
     * `/` responde 200 sempre: é o que a plataforma consulta para saber se o
     * processo está vivo, e devolver erro enquanto ninguém pareou faria ela
     * reiniciar o worker justamente durante o pareamento — um laço em que o
     * QR nunca dura o suficiente para ser lido.
     *
     * `/saude` devolve 503 quando a Mimu não está conectada. É o endereço para
     * apontar um monitor: aí sim, "não conectado" precisa acordar alguém.
     */
    const status = caminho === "/saude" && !canalDePe ? 503 : 200;

    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(corpo);
  });

  /*
   * Porta ocupada não pode derrubar o worker.
   *
   * Com mais de uma cópia rodando, só a primeira consegue escutar; as outras
   * recebem EADDRINUSE. Sem este tratamento, o erro fica sem dono, o processo
   * morre, a plataforma sobe outro no lugar e a roda não para — e o pior é que
   * cada cópia nova ainda tenta falar com o WhatsApp antes de morrer.
   *
   * Quem não conseguiu a porta continua útil: pode ser a responsável pela
   * conexão, ou estar esperando a vez. Só não atende HTTP.
   */
  servidor.on("error", (erro: NodeJS.ErrnoException) => {
    if (erro.code === "EADDRINUSE") {
      console.log(
        `[whatsapp] porta ${porta} já está com outra cópia. ` +
          "Sigo sem atender HTTP — quem responde é ela.",
      );
      return;
    }
    console.error("[whatsapp] erro na porta:", erro);
  });

  servidor.listen(porta, () => {
    console.log(`[whatsapp] porta ${porta} — / e /saude respondendo`);
    if (TOKEN) console.log("[whatsapp] QR também em /parear?token=…");
  });

  return servidor;
}
