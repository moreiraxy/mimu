import Groq from "groq-sdk";

// Client sob demanda (não no escopo do módulo) — o SDK do Groq lança erro na
// hora de instanciar se a env var estiver faltando, e o Next.js importa esse
// módulo durante a coleta de dados da build pra QUALQUER rota que o
// referencia. Instanciar aqui direto derrubava a build inteira na Vercel
// sempre que GROQ_API_KEY não estivesse configurada, mesmo em rotas que
// nunca chegam a chamar a Mimu.
let _groq: Groq | null = null;

export function getGroq(): Groq {
  if (!_groq) {
    _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return _groq;
}

/**
 * O modelo que responde pela Mimu.
 *
 * Era `llama-3.3-70b-versatile`, e a Groq o aposentou. A rota devolvia 502 e
 * a Mimu parou de responder para todo mundo, sem que nada avisasse: o erro
 * ficava só no log do servidor, que ninguém está olhando o tempo todo.
 *
 * Escolha entre o que a conta enxerga hoje, testado com uma pergunta real em
 * português: o `gpt-oss-20b` usa travessão mesmo proibido no prompt, e o
 * `qwen3.6-27b` vaza o próprio raciocínio dentro da resposta, o que apareceria
 * na tela da cliente. Este acerta o tom e respeita as regras de escrita.
 */
export const DEFAULT_MODEL = "openai/gpt-oss-120b";

/**
 * Para onde cair se o principal sumir.
 *
 * A Groq aposenta modelo sem aviso, e já derrubou a Mimu uma vez. Uma resposta
 * um pouco pior é infinitamente melhor que "a Mimu não conseguiu responder".
 */
export const MODELOS_RESERVA = ["openai/gpt-oss-20b"] as const;

/** true quando o erro da Groq é "esse modelo não existe mais". */
export function modeloSumiu(erro: unknown): boolean {
  const e = erro as { status?: number; code?: string; error?: { code?: string } };
  return e?.status === 404 || e?.code === "model_not_found" || e?.error?.code === "model_not_found";
}
