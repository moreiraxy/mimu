const CHAVE_SESSAO = "mimu:correcao";

/** Dados do registro extraído pelo chat, a caminho do formulário de "Corrigir". */
export interface CorrecaoMimu {
  valor?: string;
  descricao?: string;
  data?: string;
  horario?: string;
  clienteId?: string;
  clienteNome?: string;
}

/**
 * Handoff entre o chat da Mimu e os formulários de nova-entrada/nova-saida/
 * agenda/novo via sessionStorage — nunca via query string, pra valores
 * financeiros e nomes de cliente não ficarem expostos na URL (histórico do
 * navegador, logs de acesso).
 */
export function salvarCorrecaoMimu(dados: CorrecaoMimu): void {
  sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(dados));
}

/** Lê e imediatamente descarta — uso único, como os query params que substituiu. */
export function consumirCorrecaoMimu(): CorrecaoMimu | null {
  if (typeof window === "undefined") return null;

  const bruto = sessionStorage.getItem(CHAVE_SESSAO);
  if (!bruto) return null;
  sessionStorage.removeItem(CHAVE_SESSAO);

  try {
    return JSON.parse(bruto) as CorrecaoMimu;
  } catch {
    return null;
  }
}
