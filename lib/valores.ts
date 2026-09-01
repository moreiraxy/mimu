/**
 * Esconder os valores da tela.
 *
 * Não é privacidade contra quem tem o celular na mão — é privacidade contra
 * quem está do OUTRO LADO DO BALCÃO. A dona abre a Mimu para registrar uma
 * venda com o cliente na frente dela, e o faturamento do mês está na mesma
 * tela. Um toque no olho troca todo número por pontinhos.
 *
 * A preferência é do APARELHO, e por isso mora no localStorage e não no banco:
 * esconder faz sentido no celular do balcão e não faz no computador de casa.
 * Guardar na conta levaria a escolha de um lugar para o outro, onde ela não
 * quer dizer nada.
 *
 * A chave é exportada porque o script inline do layout (que roda antes de
 * qualquer JS do app) precisa ler a MESMA chave. Duas strings iguais escritas
 * em dois lugares é o tipo de coisa que se separa em silêncio.
 */
export const CHAVE_VALORES = "mimu:valores-escondidos";

/** O que aparece no lugar do número. */
export const VALOR_ESCONDIDO = "R$ ••••";

export function lerEscondidos(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CHAVE_VALORES) === "1";
  } catch {
    // Navegação privada com armazenamento bloqueado. Mostrar é o padrão.
    return false;
  }
}

export function gravarEscondidos(escondidos: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (escondidos) window.localStorage.setItem(CHAVE_VALORES, "1");
    else window.localStorage.removeItem(CHAVE_VALORES);
  } catch {
    // Sem armazenamento, a escolha vale só nesta sessão. Melhor que quebrar.
  }
}
