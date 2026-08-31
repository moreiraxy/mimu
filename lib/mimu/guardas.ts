import { excedeuLimite, registrarTentativa } from "@/lib/rate-limit";
import { enviarPushParaEmpresa } from "@/lib/push";
import {
  buildAlertaMessage,
  urlParaAlerta,
  type AlertaMetadata,
} from "@/lib/mimu-prompts";
import type { ClientComIdentidade } from "@/lib/supabase/identidade";
import type { Json } from "@/types/database";

/**
 * As guardas que valem para QUALQUER canal por onde a Mimu atenda.
 *
 * Estavam dentro de app/api/mimu/chat/route.ts, servindo só ao app. Saíram
 * para cá quando o WhatsApp entrou, e a razão é a regra do brief: nada de
 * duplicar regra de negócio no handler do canal. Uma segunda cópia do teto de
 * caracteres, ou do filtro de prompt injection, divergiria da primeira na
 * primeira vez que alguém mexesse numa só — e o canal esquecido viraria a
 * porta destrancada.
 *
 * Aqui não há nada de HTTP nem de WhatsApp: cada canal chama estas funções na
 * mesma ordem e traduz o resultado do seu jeito.
 */

/**
 * Teto de tamanho por mensagem.
 *
 * Sem ele, uma mensagem de megabytes seguiria direto para o Groq (duas
 * chamadas por mensagem). 2000 caracteres é muito acima de qualquer frase real
 * ("vendi uma escova por 120") e ainda assim limita o custo por requisição.
 */
export const MAX_CARACTERES_MENSAGEM = 2000;

/**
 * Tentativas de extrair o prompt interno da Mimu, ou de perguntar sobre a
 * infraestrutura técnica por trás dela.
 */
const PALAVRAS_EXTRACAO_PROMPT = [
  "prompt",
  "instruções",
  "system",
  "ignore",
  "jailbreak",
  "dan",
  "finja",
  "você agora é",
  "esqueça",
  "nova personalidade",
  "sem restrições",
  "modo desenvolvedor",
  "act as",
];

const PALAVRAS_DADOS_TECNICOS = [
  "supabase",
  "groq",
  "llama",
  "api key",
  "banco de dados",
  "next.js",
  "token",
  "variável de ambiente",
];

/** true quando a mensagem cheira a tentativa de extrair o prompt. */
export function pareceInjecaoDePrompt(mensagem: string): boolean {
  const texto = mensagem.toLowerCase();
  return [...PALAVRAS_EXTRACAO_PROMPT, ...PALAVRAS_DADOS_TECNICOS].some(
    (palavra) => texto.includes(palavra),
  );
}

/**
 * O teto de mensagens por hora, por usuária.
 *
 * Checado ANTES de gravar a mensagem e antes de qualquer chamada à IA — o
 * custo está nas chamadas ao Groq, então bloquear depois de gastar não
 * adiantaria nada.
 *
 * Vale por USUÁRIA e não por canal, de propósito: quem esgotou o limite
 * conversando no app não ganha uma cota nova indo para o WhatsApp. É a mesma
 * pessoa gastando a mesma API.
 */
export async function excedeuLimiteDoChat(userId: string): Promise<boolean> {
  return excedeuLimite("chat_ia", userId);
}

export async function registrarUsoDoChat(userId: string): Promise<void> {
  await registrarTentativa("chat_ia", userId);
}

/** Guarda a mensagem de quem perguntou. Devolve false se não conseguiu. */
export async function salvarMensagemDaUsuaria(
  supabase: ClientComIdentidade,
  empresaId: string,
  texto: string,
): Promise<boolean> {
  const { error } = await supabase
    .from("conversas_mimu")
    .insert({ empresa_id: empresaId, role: "user", content: texto });
  return !error;
}

/** Guarda uma resposta da Mimu que não veio do modelo. */
export async function salvarRespostaDaMimu(
  supabase: ClientComIdentidade,
  empresaId: string,
  conteudo: string,
): Promise<{ id: string; criadaEm: string } | null> {
  const { data, error } = await supabase
    .from("conversas_mimu")
    .insert({
      empresa_id: empresaId,
      role: "assistant",
      content: conteudo,
      metadata: null,
    })
    .select("id, created_at")
    .single();

  if (error || !data) return null;
  return { id: data.id, criadaEm: data.created_at };
}

/** O que a Mimu responde a uma mensagem bloqueada. */
export const RESPOSTA_BLOQUEADA =
  "Estou aqui para te ajudar com o seu negócio. Pode me perguntar sobre suas " +
  "vendas, agendamentos, clientes ou metas.";

/**
 * Registra a tentativa de prompt injection e avisa a dona da conta.
 *
 * O alerta e o push existem porque a tentativa quase nunca parte da dona: ela
 * já tem os dados dela, não precisa arrancá-los da Mimu. Parte de quem está
 * com o aparelho dela na mão — e ela precisa saber disso.
 *
 * Ganha peso agora que existe WhatsApp: ali quem escreve pode ser qualquer
 * pessoa com acesso ao celular, e o aviso chega justamente pelo app.
 */
export async function registrarBloqueio(
  supabase: ClientComIdentidade,
  empresaId: string,
  mensagemOriginal: string,
): Promise<void> {
  const metadata: AlertaMetadata = { trecho: mensagemOriginal.slice(0, 200) };
  const mensagemAlerta = buildAlertaMessage("tentativa_prompt_injection");

  const { data: alerta, error } = await supabase
    .from("alertas_mimu")
    .insert({
      empresa_id: empresaId,
      tipo: "tentativa_prompt_injection",
      mensagem: mensagemAlerta,
      metadata: JSON.parse(JSON.stringify(metadata)) as Json,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Não consegui registrar tentativa de prompt injection:", error);
    return;
  }

  if (alerta) {
    await enviarPushParaEmpresa(supabase, empresaId, {
      title: "Mimu",
      body: mensagemAlerta,
      url: urlParaAlerta("tentativa_prompt_injection", metadata),
    });
  }
}
