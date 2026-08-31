import { createClientComoUsuario } from "@/lib/supabase/como-usuario";
import { responderConsulta } from "@/lib/mimu/consulta";
import { verificarAcesso, RESPOSTA_SEM_ACESSO } from "@/lib/mimu/acesso";
import { transcrever } from "@/lib/mimu/transcricao";
import {
  classificarIntencao,
  identificarPendenciaRegistro,
} from "@/lib/mimu/classificacao";
import { registrar } from "@/lib/mimu/registro";
import {
  pediuParaDesfazer,
  desfazerUltima,
  pedidoBloqueado,
  RESPOSTA_BLOQUEIO_DESTRUTIVO,
} from "@/lib/mimu/desfazer";
import {
  MAX_CARACTERES_MENSAGEM,
  pareceInjecaoDePrompt,
  excedeuLimiteDoChat,
  registrarUsoDoChat,
  salvarMensagemDaUsuaria,
  salvarRespostaDaMimu,
  registrarBloqueio,
  RESPOSTA_BLOQUEADA,
} from "@/lib/mimu/guardas";
import type { MensagemRecebida } from "@/lib/canais/tipos";
import type { Empresa } from "@/types";

/**
 * A Mimu respondendo por um canal de fora do app.
 *
 * Passa pelas MESMAS guardas do chat do app — teto de tamanho, limite por
 * usuária, filtro de prompt injection — chamando as mesmas funções de
 * lib/mimu/guardas.ts. Nenhuma regra é reescrita aqui: o brief é explícito
 * que dado divergente entre canais é o pior defeito possível neste projeto, e
 * regra duplicada é como a divergência começa.
 *
 * Consulta E registro. O registro grava primeiro e oferece a saída depois,
 * como manda o brief — e essa troca só é honesta porque `desfazer` existe e
 * funciona de primeira. Operação destrutiva continua fora daqui.
 */

/**
 * O texto como o WhatsApp entende.
 *
 * O modelo às vezes devolve markdown, e no WhatsApp `**negrito**` aparece com
 * os asteriscos na cara. A conversão é curta de propósito: negrito, itálico e
 * a limpeza de cabeçalho cobrem o que aparece de verdade numa conversa curta.
 */
function paraWhatsApp(texto: string): string {
  return texto
    .replace(/\*\*(.+?)\*\*/g, "*$1*")
    .replace(/(^|\s)__(.+?)__(?=\s|$)/g, "$1_$2_")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}

/**
 * O que dizer quando o áudio não virou texto.
 *
 * Uma frase por motivo, porque as saídas da pessoa são diferentes: áudio longo
 * demais ela resolve mandando mais curto, áudio mudo ela resolve regravando, e
 * falha nossa ela resolve esperando. "Não consegui processar" não diria o que
 * fazer em nenhum dos três.
 */
const RESPOSTA_AUDIO_FALHOU: Record<
  "grande_demais" | "vazio" | "falhou",
  string
> = {
  grande_demais:
    "Esse áudio ficou comprido demais pra mim. Manda um mais curtinho?",
  vazio: "Não consegui ouvir nada nesse áudio. Tenta gravar de novo?",
  falhou:
    "Não consegui entender seu áudio agora. Tenta de novo, ou me escreve?",
};

export async function responderPelaMimu(
  mensagem: MensagemRecebida,
  conta: { empresaId: string; userId: string },
): Promise<string> {
  let texto = mensagem.texto.trim();

  if (texto.length > MAX_CARACTERES_MENSAGEM) {
    return "Essa mensagem ficou comprida demais pra mim. Manda em partes menores?";
  }

  /*
   * O limite é por usuária, e vale entre canais.
   *
   * Quem esgotou conversando no app não ganha cota nova no WhatsApp: é a mesma
   * pessoa gastando a mesma API. Checado antes de gravar e antes de qualquer
   * chamada ao modelo, porque é ali que está o custo.
   */
  if (await excedeuLimiteDoChat(conta.userId)) {
    return "Você me mandou muitas mensagens seguidas. Espera um pouquinho e me chama de novo. 💚";
  }
  await registrarUsoDoChat(conta.userId);

  /*
   * O client carrega a identidade de quem escreveu, e é isso que mantém o RLS
   * valendo num canal sem login. Ver lib/supabase/como-usuario.ts.
   */
  const supabase = createClientComoUsuario(conta.userId);

  const { data: empresa } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", conta.empresaId)
    .maybeSingle();

  if (!empresa) {
    return "Não consegui achar os dados do seu negócio agora. Tenta de novo daqui a pouco?";
  }

  /*
   * Suspensão e plano, ANTES de gastar qualquer coisa.
   *
   * O WhatsApp não passa pelo middleware, então esta é a única chance de
   * aplicar o que o app aplica. Vem antes de salvar a mensagem e antes de
   * qualquer chamada ao modelo: quem não tem direito à IA não deve nem
   * consumir a cota, nem deixar a conversa gravada como se tivesse
   * conversado.
   */
  const acesso = await verificarAcesso(supabase, conta.empresaId);
  if (!acesso.liberado) {
    return RESPOSTA_SEM_ACESSO[acesso.motivo];
  }

  /*
   * SÓ AGORA o áudio vira texto.
   *
   * Depois de conferir suspensão e plano, e não antes. Transcrever custa por
   * minuto: fazer isso antes do gate significava pagar o Whisper para depois
   * responder "você não tem acesso" — para conta suspensa, para conta no plano
   * gratuito, para todo mundo que mandasse um áudio sem ter direito.
   *
   * O `obterAudio` chegou aqui intacto justamente para isso: quem decide se
   * vale gastar é quem conhece plano e suspensão.
   */
  if (!texto && mensagem.obterAudio) {
    const audio = await mensagem.obterAudio().catch(() => null);
    const transcricao = audio ? await transcrever(audio) : null;

    if (!transcricao?.ok) {
      return RESPOSTA_AUDIO_FALHOU[transcricao?.motivo ?? "falhou"];
    }

    texto = transcricao.texto;
  }

  if (!texto) {
    return "Não consegui entender essa mensagem. Me manda em texto ou áudio?";
  }

  if (!(await salvarMensagemDaUsuaria(supabase, conta.empresaId, texto))) {
    return "Não consegui guardar sua mensagem agora. Tenta de novo?";
  }

  /*
   * Bloqueio ANTES de qualquer chamada ao modelo.
   *
   * O aviso vai para a dona pelo app, e não por aqui: a tentativa quase nunca
   * parte dela — parte de quem está com o celular dela na mão. Responder
   * "detectei uma tentativa" no WhatsApp avisaria justamente quem tentou.
   */
  if (pareceInjecaoDePrompt(texto)) {
    await registrarBloqueio(supabase, conta.empresaId, texto);
    await salvarRespostaDaMimu(supabase, conta.empresaId, RESPOSTA_BLOQUEADA);
    return RESPOSTA_BLOQUEADA;
  }

  /*
   * "desfazer" vem ANTES de tudo, e nem passa pelo classificador.
   *
   * Duas razões. É de graça: comparação de string, sem chamada ao modelo. E é
   * seguro: mandar "desfazer" para um classificador abriria a chance de ele
   * entender outra coisa numa mensagem que pedia justamente para reverter.
   */
  if (pediuParaDesfazer(texto)) {
    const desfeita = await desfazerUltima(supabase, conta.empresaId);

    if (desfeita.ok) {
      return `Pronto, desfiz.\n\n_${desfeita.oQueFoiDesfeito}_\n\nApaguei das suas contas. 💚`;
    }
    return desfeita.motivo === "nada_para_desfazer"
      ? "Não achei nada recente pra desfazer. Se foi coisa de mais de um dia atrás, dá pra ajustar pelo app."
      : "Não consegui desfazer agora. Tenta de novo daqui a pouquinho?";
  }

  /*
   * Operação destrutiva não acontece por aqui (4.6 do brief).
   *
   * Não é falta de autenticação: é que erro de interpretação apagando o mês
   * inteiro é um estrago que ninguém perdoa. E número de WhatsApp é
   * autenticação fraca — chip clonado, celular roubado, número reciclado.
   */
  if (pedidoBloqueado(texto)) {
    return RESPOSTA_BLOQUEIO_DESTRUTIVO;
  }

  /*
   * Só agora o classificador roda, porque ele custa uma chamada ao modelo.
   * Registro e consulta se separam aqui.
   */
  const classificacao = await classificarIntencao(texto);

  if (classificacao?.intencao === "registro") {
    const pendencia = identificarPendenciaRegistro(classificacao);
    if (pendencia) return pendencia;

    const registrado = await registrar(
      supabase,
      conta.empresaId,
      mensagem.canal,
      mensagem.idNoCanal,
      classificacao,
    );

    if (registrado.ok) {
      await salvarRespostaDaMimu(supabase, conta.empresaId, registrado.recibo);
      return registrado.recibo;
    }

    // Ambíguo e incompleto NÃO gravaram nada: a pergunta é o produto, e
    // gravar com dúvida contaminaria o relatório sem deixar rastro.
    if (registrado.motivo === "ambiguo" || registrado.motivo === "incompleto") {
      return registrado.pergunta;
    }

    return "Não consegui registrar agora. Tenta de novo, ou faz pelo app?";
  }

  const resultado = await responderConsulta(supabase, empresa as Empresa);

  if (!resultado.ok) {
    /*
     * Uma frase por motivo, em vez de "erro interno".
     *
     * Quem está do outro lado é uma pessoa no balcão, não um desenvolvedor
     * lendo status code. O que ela precisa saber é se adianta tentar de novo.
     */
    switch (resultado.motivo) {
      case "ia_indisponivel":
        return "Deu um branco aqui e não consegui pensar direito. Me chama de novo em um minutinho?";
      case "dados_indisponiveis":
      case "historico_indisponivel":
        return "Não consegui puxar os dados do seu negócio agora. Tenta de novo daqui a pouco?";
      case "nao_salvou":
        return "Consegui pensar na resposta mas não guardei a conversa. Melhor você conferir pelo app.";
    }
  }

  return paraWhatsApp(resultado.texto);
}
