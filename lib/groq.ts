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

/**
 * true quando vale a pena tentar outro modelo em vez de desistir.
 *
 * Dois casos, e o segundo não é óbvio.
 *
 * O modelo sumiu (404): foi o que derrubou a Mimu quando a Groq aposentou o
 * llama.
 *
 * Estourou o limite (429): a Groq conta o limite POR MODELO, não por chave.
 * Medido nos cabeçalhos, cada modelo tem o próprio saldo. Então cair no
 * reserva num pico de uso realmente entrega a resposta, em vez de repetir o
 * mesmo erro num modelo já saturado.
 */
export function deveTentarOutroModelo(erro: unknown): boolean {
  const e = erro as { status?: number; code?: string; error?: { code?: string } };
  const codigo = e?.code ?? e?.error?.code;
  return (
    e?.status === 404 ||
    e?.status === 429 ||
    codigo === "model_not_found" ||
    codigo === "rate_limit_exceeded"
  );
}
