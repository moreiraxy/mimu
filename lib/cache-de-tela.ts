/**
 * O que cada tela já mostrou uma vez, guardado enquanto o app está aberto.
 *
 * O PROBLEMA QUE ISTO RESOLVE, medido: tocar numa aba trocava o endereço em
 * 400ms mas o conteúdo só aparecia 1,4 a 2,3 SEGUNDOS depois. No meio, a tela
 * era um esqueleto cinza. Voltar para uma tela já visitada custava o mesmo que
 * abri-la pela primeira vez: buscar tudo de novo, do zero, para desenhar
 * exatamente o que estava ali um minuto antes.
 *
 * Do lado de fora, dois segundos de nada depois de um toque não parecem
 * "carregando" — parecem que o toque não pegou. É por isso que se toca de
 * novo.
 *
 * Agora a tela abre INSTANTANEAMENTE com o que tinha, e a busca continua
 * acontecendo por trás; quando a resposta chega, o que mudou muda na tela. Se
 * nada mudou — o caso comum de trocar de aba e voltar — não pisca nada.
 *
 * MORA NA MEMÓRIA, e não no localStorage. Dado de negócio escrito no disco do
 * navegador fica lá depois de sair da conta, e num aparelho compartilhado isso
 * é o saldo de uma pessoa visível para a próxima. Aqui ele morre junto com a
 * aba, que é o tempo de vida certo para um atalho de desempenho.
 */
const memoria = new Map<string, unknown>();

export function leDoCache<T>(chave: string): T | undefined {
  return memoria.get(chave) as T | undefined;
}

export function guardaNoCache<T>(chave: string, valor: T): void {
  memoria.set(chave, valor);
}

/**
 * Esquece o que foi guardado.
 *
 * Sem argumento, esquece TUDO — e é o que se usa depois de criar ou apagar
 * qualquer coisa. Parece exagero esquecer a agenda porque uma despesa foi
 * lançada, e é de propósito: uma venda mexe no saldo, no faturamento do
 * painel, na meta do mês e no total gasto da cliente. Mapear quem depende de
 * quem seria uma lista para alguém esquecer de atualizar no dia em que uma
 * tela nova aparecer — e o defeito resultante é o pior possível num app de
 * dinheiro: um número velho com cara de número certo.
 *
 * O custo de errar para este lado é uma busca a mais.
 */
export function limpaCache(prefixo?: string): void {
  if (!prefixo) {
    memoria.clear();
    return;
  }
  for (const chave of memoria.keys()) {
    if (chave.startsWith(prefixo)) memoria.delete(chave);
  }
}
