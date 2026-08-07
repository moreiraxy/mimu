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

export const DEFAULT_MODEL = "llama-3.3-70b-versatile";
