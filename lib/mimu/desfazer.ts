import type { ClientComIdentidade } from "@/lib/supabase/identidade";

/**
 * Desfazer a última coisa que a Mimu registrou por mensagem.
 *
 * É a contrapartida de gravar sem perguntar. O brief manda gravar primeiro e
 * oferecer a saída depois, e essa troca só é honesta se a saída funcionar de
 * primeira — quem digitou "desfazer" já está com a impressão de que a Mimu
 * errou, e uma segunda frustração ali derruba a confiança no canal inteiro.
 *
 * Reversão é LÓGICA: marca `revertida_em` e a linha some de todas as consultas
 * pela policy de SELECT (ver 20260830170000). O dado continua existindo, então
 * desfazer por engano tem volta.
 */

export type ResultadoDesfazer =
  | { ok: true; oQueFoiDesfeito: string }
  | { ok: false; motivo: "nada_para_desfazer" | "falhou" };

/**
 * As palavras que significam "desfaz isso".
 *
 * Lista e não modelo de IA: é uma operação destrutiva, e classificar por
 * modelo introduziria a chance de ele entender "desfazer" numa frase que não
 * pedia isso. Comparação exata é chata e é o que se quer aqui.
 */
const PALAVRAS_DESFAZER = new Set([
  "desfazer",
  "desfaz",
  "desfazer!",
  "cancelar",
  "cancela",
  "apagar isso",
  "errado",
  "ta errado",
  "tá errado",
  "nao era isso",
  "não era isso",
]);

export function pediuParaDesfazer(texto: string): boolean {
  return PALAVRAS_DESFAZER.has(
    texto
      .trim()
      .toLowerCase()
      .replace(/[.…]+$/, ""),
  );
}

export async function desfazerUltima(
  supabase: ClientComIdentidade,
  empresaId: string,
): Promise<ResultadoDesfazer> {
  /*
   * A última ainda dentro da janela.
   *
   * `desfazivel_ate` existe para "desfazer" nunca alcançar a semana passada:
   * a pessoa que digita isso está reagindo ao que acabou de ler, e desfazer
   * silenciosamente uma venda de terça seria muito pior do que não desfazer
   * nada.
   */
  const { data: operacao } = await supabase
    .from("operacoes_canal")
    .select("id, recibo")
    .eq("empresa_id", empresaId)
    .is("desfeita_em", null)
    .gt("desfazivel_ate", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!operacao) return { ok: false, motivo: "nada_para_desfazer" };

  /*
   * A reversão acontece dentro do banco, não daqui.
   *
   * Não é preferência de estilo: a policy de SELECT esconde as linhas
   * revertidas, e o Postgres aplica esse mesmo filtro à linha nova de um
   * UPDATE — então marcar `revertida_em` daqui era recusado com "new row
   * violates row-level security policy". A função é `security definer` e faz
   * a checagem de dono por dentro. Ver a migration 20260830170000.
   *
   * De quebra as duas escritas viram uma transação só: não existe mais o
   * estado intermediário em que a venda foi revertida mas a operação
   * continua constando como desfazível.
   */
  const { data: deuCerto, error } = await supabase.rpc(
    "desfazer_operacao_canal",
    { p_operacao_id: operacao.id },
  );

  if (error || !deuCerto) {
    if (error) console.error("Não consegui desfazer a operação.", error);
    return { ok: false, motivo: error ? "falhou" : "nada_para_desfazer" };
  }

  // A primeira linha do recibo é o que foi registrado; o resto é a instrução
  // de desfazer, que não faz sentido repetir agora.
  return { ok: true, oQueFoiDesfeito: operacao.recibo.split("\n")[0]! };
}

/**
 * O que este canal NÃO faz, por mais que peçam (seção 4.6 do brief).
 *
 * Não é questão de autenticação: é que erro de interpretação de linguagem
 * natural apagando o mês inteiro é um estrago que ninguém perdoa. E número de
 * WhatsApp é autenticação fraca — chip clonado, celular roubado, número
 * reciclado pela operadora.
 *
 * A lista é de palavras, e não de classificação por IA, pelo mesmo motivo do
 * `pediuParaDesfazer`: para decidir o que BLOQUEAR, chato e literal é melhor
 * do que esperto e ocasionalmente errado.
 */
const PEDIDOS_BLOQUEADOS = [
  "apagar tudo",
  "apaga tudo",
  "excluir tudo",
  "exclui tudo",
  "deletar tudo",
  "deleta tudo",
  "limpar tudo",
  "limpa tudo",
  "apagar todas",
  "apaga todas",
  "excluir todas",
  "exclui todas",
  "apagar todos",
  "apaga todos",
  "zerar o caixa",
  "zerar caixa",
  "apagar o mês",
  "apagar o mes",
  "refazer o mês",
  "refazer o mes",
];

export function pedidoBloqueado(texto: string): boolean {
  const limpo = texto.trim().toLowerCase();
  return PEDIDOS_BLOQUEADOS.some((p) => limpo.includes(p));
}

export const RESPOSTA_BLOQUEIO_DESTRUTIVO =
  "Isso eu prefiro não fazer por aqui — é grande demais pra arriscar entender " +
  "errado. Faça pelo app, onde você vê tudo antes de confirmar. 💚";
