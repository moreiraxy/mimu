/**
 * Endereço público do site, num lugar só.
 *
 * Sitemap, robots e as URLs canônicas precisam de endereço ABSOLUTO — link
 * relativo não serve pra nenhum dos três. Em vez de repetir a variável de
 * ambiente em cada arquivo (e correr o risco de um ficar pra trás), todo
 * mundo lê daqui.
 *
 * A barra final é removida sempre: sem isso, juntar com o caminho produz
 * `https://site.com//assinar`, que buscadores tratam como outra página.
 */
function enderecoDoSite(): string {
  const bruto = (
    process.env.NEXT_PUBLIC_APP_URL ?? "https://mimu.pro"
  ).replace(/\/+$/, "");

  /*
   * Confere aqui, na subida, e não onde a URL for usada.
   *
   * Um valor inválido só estourava lá adiante, num `new URL()` dentro do
   * Next, e o build morria com "TypeError: Invalid URL" e uma pilha de
   * arquivos compilados — sem dizer QUAL variável, nem qual valor. Custou um
   * deploy inteiro para descobrir que o painel de hospedagem tinha colado
   * `=https://mimu.pro`, com o sinal de igual junto.
   *
   * Falhar aqui não evita o erro; evita a caçada.
   */
  try {
    new URL(bruto);
  } catch {
    throw new Error(
      `NEXT_PUBLIC_APP_URL não é um endereço válido: ${JSON.stringify(bruto)}. ` +
        `Precisa ser algo como "https://mimu.pro" — com https:// e sem barra no fim. ` +
        `Se veio de painel de hospedagem, confira se não entrou um "=" ou espaço junto.`,
    );
  }

  return bruto;
}

export const URL_SITE = enderecoDoSite();

/** Monta uma URL absoluta a partir de um caminho interno. */
export function urlAbsoluta(caminho: string): string {
  return `${URL_SITE}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}

/**
 * Páginas que fazem sentido aparecer numa busca.
 *
 * O resto do app exige login: um buscador que tentasse entrar seria mandado
 * pro /login, e o que ele indexaria seria a tela de login com o endereço de
 * outra página. Por isso a lista é curta de propósito.
 */
export const PAGINAS_PUBLICAS = [
  { caminho: "/", prioridade: 1, frequencia: "weekly" as const },
  { caminho: "/historias", prioridade: 0.7, frequencia: "monthly" as const },
  { caminho: "/cadastro", prioridade: 0.8, frequencia: "monthly" as const },
];
