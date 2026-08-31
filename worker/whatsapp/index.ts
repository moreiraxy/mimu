import { join } from "node:path";
import qrcode from "qrcode-terminal";
import { conectar, type EstadoConexao } from "./conexao";
import { servirSaude, type Situacao } from "./saude";
import {
  tentarAssumir,
  donoAtual,
  ESPERA_ENTRE_TENTATIVAS_MS,
  type Trava,
} from "./exclusividade";
import { atender } from "@/lib/canais/atendimento";
import { registrarEvento } from "@/lib/eventos";
import { avisarAdmins } from "@/lib/avisos-internos";
import { responderPelaMimu } from "@/lib/canais/mimu-responde";
import type { Atendente } from "@/lib/canais/tipos";

/**
 * O processo que mantém a Mimu no WhatsApp.
 *
 * Roda SEPARADO do app Next, e não pode ser de outro jeito: o Baileys mantém
 * um WebSocket aberto o tempo todo, e rota de API é feita para viver o tempo
 * de uma requisição. Numa plataforma que hiberna ou reinicia processo web
 * ocioso, a conexão cairia junto.
 *
 *   npm run whatsapp
 *
 * Na primeira vez aparece um QR para ler com o celular do número da Mimu
 * (WhatsApp → Aparelhos conectados). Depois disso a sessão fica na pasta e o
 * QR não volta a aparecer, a não ser que alguém desconecte pelo celular.
 */

/**
 * Onde a sessão do WhatsApp mora.
 *
 * ATENÇÃO AO DEPLOY: em plataforma com disco efêmero — o Railway é uma — esta
 * pasta some a cada deploy, e some junto o pareamento: alguém teria que ler o
 * QR de novo a cada publicação. Para valer, ela precisa apontar para um volume
 * persistente, e é para isso que a variável existe.
 */
const PASTA_DA_SESSAO =
  process.env.WHATSAPP_SESSAO_DIR ?? join(process.cwd(), ".whatsapp-sessao");

/**
 * A Mimu atendendo.
 *
 * `atender` cuida do que vale para qualquer canal — idempotência, descobrir de
 * quem é o número, resposta padrão para quem ainda não conectou. Só depois
 * disso a Mimu é chamada, e só para quem já está vinculada.
 *
 * O eco da fase 3 saiu daqui e nada em volta mudou, que era o ponto do
 * desenho: trocar quem responde não mexe na conexão nem no atendimento.
 */
const mimu: Atendente = (mensagem) => atender(mensagem, responderPelaMimu);

/*
 * O que a porta HTTP responde. Um objeto só, atualizado no lugar.
 *
 * Lido a cada requisição em vez de copiado: assim a página sempre mostra o
 * estado de agora, e não o de quando o servidor subiu.
 */
const contadores = { lotes: 0, brutas: 0, aceitas: 0, descartes: {} };

const situacao: Situacao = {
  estado: "subindo",
  desde: new Date().toISOString(),
  qr: null,
  contadores,
};

function aoMudarEstado(estado: EstadoConexao, detalhe?: string) {
  situacao.estado = estado;
  situacao.desde = new Date().toISOString();

  /*
   * O QR fica guardado só enquanto serve.
   *
   * Depois de conectado ele não vale mais nada, e continuar servindo um código
   * morto numa página só confunde quem for conferir se está tudo certo.
   */
  situacao.qr = estado === "aguardando_leitura_do_qr" ? (detalhe ?? null) : null;

  switch (estado) {
    case "aguardando_leitura_do_qr":
      console.log(
        "\n[whatsapp] Leia este QR no celular da Mimu:\n" +
          "  WhatsApp → Configurações → Aparelhos conectados → Conectar aparelho\n",
      );
      qrcode.generate(detalhe!, { small: true });
      break;

    case "conectado":
      console.log("[whatsapp] conectado. Escutando mensagens.");
      registrarEvento("whatsapp_conectou");
      break;

    case "reconectando":
      /*
       * Barulhento no console E registrado como evento.
       *
       * Console só serve para quem está olhando o terminal, e ninguém está às
       * três da manhã. O evento aparece no painel admin, que é onde alguém
       * consegue reparar depois — é o mesmo remédio dos três apagões que
       * fizeram a tabela `eventos` existir.
       *
       * Sem aviso aos admins ainda: reconexão é comum e esperada (queda de
       * rede, reinício do servidor da Meta). Notificar a cada uma treinaria
       * todo mundo a ignorar o aviso, e aí o que importa passa batido.
       */
      console.warn(`[whatsapp] caiu (${detalhe}). Reconectando em 3s...`);
      registrarEvento("whatsapp_caiu", { detalhe: { motivo: detalhe ?? null } });
      break;

    case "desconectado_precisa_parear":
      console.error(`[whatsapp] ${detalhe}`);
      console.error(
        "[whatsapp] Nenhuma mensagem será respondida até alguém parear de novo.",
      );
      /*
       * ESTE avisa os admins de verdade, por push.
       *
       * É a única queda que não se resolve sozinha: alguém desconectou pelo
       * celular, ou o número foi banido. A partir daqui a Mimu está muda no
       * WhatsApp por tempo indeterminado, e quanto mais demora para alguém
       * saber, mais gente escreve e não é respondida.
       */
      registrarEvento("whatsapp_caiu", {
        detalhe: { motivo: detalhe ?? null, definitivo: true },
      });
      avisarAdmins({
        title: "O WhatsApp da Mimu caiu",
        body: `Precisa parear de novo. ${detalhe ?? ""}`.slice(0, 140),
        url: "/admin",
      });
      break;

    default:
      console.log(`[whatsapp] ${estado}`);
  }
}

/**
 * O que o worker precisa para funcionar de verdade.
 *
 * Conferido na SUBIDA, e não no primeiro uso. Sem esta checagem o worker
 * pareia normalmente, mostra "conectado", e só quebra quando a primeira pessoa
 * de verdade manda mensagem — que é quando ninguém está olhando o log. Falhar
 * agora, com o nome da variável na tela, custa um minuto; falhar depois custa
 * uma cliente achando que a Mimu está quebrada.
 */
const VARIAVEIS_OBRIGATORIAS = {
  NEXT_PUBLIC_SUPABASE_URL: "endereço do Supabase",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "chave pública do Supabase",
  SUPABASE_SERVICE_ROLE_KEY: "service role, para descobrir de quem é o número",
  SUPABASE_JWT_SECRET:
    "segredo de JWT (Project Settings → API → JWT Secret). É ele que deixa " +
    "a Mimu responder mantendo o RLS — sem ele, responder exigiria desligar " +
    "o isolamento entre contas, o que não é opção",
  GROQ_API_KEY: "chave da Groq, para a Mimu pensar e transcrever áudio",
};

function conferirAmbiente() {
  const faltando = Object.entries(VARIAVEIS_OBRIGATORIAS).filter(
    ([nome]) => !process.env[nome],
  );

  if (faltando.length === 0) return;

  console.error("\n[whatsapp] Não posso subir. Faltam variáveis de ambiente:\n");
  for (const [nome, porque] of faltando) {
    console.error(`  ${nome}`);
    console.error(`    ${porque}\n`);
  }
  process.exit(1);
}

async function main() {
  conferirAmbiente();
  console.log(`[whatsapp] sessão em ${PASTA_DA_SESSAO}`);

  /*
   * A porta sobe ANTES da conexão com o WhatsApp, e é de propósito.
   *
   * Hospedagem gerenciada dá um prazo curto para o processo começar a
   * responder, e o pareamento pode demorar minutos — se a porta esperasse por
   * ele, a plataforma mataria o worker antes de alguém conseguir ler o QR.
   */
  const servidorDeSaude = servirSaude(situacao, PASTA_DA_SESSAO);

  /*
   * Só uma cópia fala com o WhatsApp.
   *
   * A plataforma roda o app em mais de um processo, e para HTTP isso é bom.
   * Para o WhatsApp é fatal: a sessão pertence a uma conexão, e a segunda a
   * usar as mesmas credenciais derruba a primeira (440). A primeira reconecta e
   * derruba a segunda, indefinidamente — foi o que aconteceu em produção,
   * conectando e caindo a cada três segundos, sem entregar nenhuma mensagem.
   *
   * Quem não conseguir a vez continua de pé e continua respondendo HTTP: a
   * plataforma precisa disso para considerar o processo saudável, e derrubá-lo
   * só faria ela subir outro no lugar. Ele fica esperando, e assume se o dono
   * parar de dar sinal.
   */
  let trava = tentarAssumir(PASTA_DA_SESSAO);

  while (!trava) {
    const dono = donoAtual(PASTA_DA_SESSAO);
    situacao.estado = "em_espera";
    situacao.detalhe = dono
      ? `outra cópia (pid ${dono.pid}) está conectada desde ${dono.desde}`
      : "esperando a vez";
    console.log(`[whatsapp] ${situacao.detalhe}. Tentando de novo em 15s.`);

    await new Promise((r) => setTimeout(r, ESPERA_ENTRE_TENTATIVAS_MS));
    trava = tentarAssumir(PASTA_DA_SESSAO);
  }

  console.log("[whatsapp] esta cópia é a responsável pela conexão.");

  const conexao = await conectar({
    pastaDaSessao: PASTA_DA_SESSAO,
    atender: mimu,
    aoMudarEstado,
    contadores,
  });

  /*
   * Saída limpa.
   *
   * `parar()` espera a fila esvaziar antes de fechar o socket. Sem isso, um
   * deploy no meio de uma conversa deixaria uma mensagem marcada como recebida
   * e nunca respondida — e a idempotência impede que ela seja reprocessada,
   * então a pessoa simplesmente ficaria sem resposta, para sempre.
   */
  for (const sinal of ["SIGINT", "SIGTERM"] as const) {
    process.on(sinal, () => {
      console.log(`\n[whatsapp] ${sinal} recebido. Terminando o que está na fila...`);
      conexao
        .parar()
        .then(() => {
          trava?.soltar();
          servidorDeSaude.close();
          process.exit(0);
        })
        .catch(() => process.exit(1));
    });
  }
}

main().catch((erro) => {
  console.error("[whatsapp] não consegui subir:", erro);
  process.exit(1);
});
