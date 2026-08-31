/**
 * Como a Mimu sabe que está rodando dentro do app da App Store.
 *
 * Isto não é preferência de layout: é o que decide POR ONDE se cobra, e é o
 * que mantém o app publicável.
 *
 * A Mimu vende pelos dois caminhos. Na web, Mercado Pago recorrente, sem
 * comissão nenhuma. No iOS, In-App Purchase da Apple — porque a diretriz
 * 3.1.1 exige que assinatura digital consumida dentro do app passe pelo IAP,
 * e porque é o que faz o cancelamento aparecer em Ajustes → Assinaturas, que
 * é onde as pessoas procuram.
 *
 * O que esta detecção impede é os dois se cruzarem. Dentro do app, o checkout
 * do Mercado Pago não pode aparecer em lugar nenhum: nem como tela, nem como
 * redirect do middleware, nem como link para o site. A regra do anti-steering
 * vale inteira fora dos Estados Unidos, e é a metade que se quebra sem
 * querer — um redirect para /assinar não parece um botão de compra, mas é.
 *
 * Por isso a detecção mora aqui, num lugar só, e não espalhada em `if`s pelas
 * telas. Cada lugar que fala de dinheiro pergunta a esta função antes de se
 * desenhar, e a resposta decide se mostra StoreKit ou Mercado Pago.
 */

/**
 * A marca que o app injeta no User-Agent, via `appendUserAgent` no
 * capacitor.config.ts.
 *
 * É o User-Agent e não um cabeçalho próprio porque o app carrega a Mimu
 * hospedada dentro de uma WKWebView: cabeçalho customizado não sobrevive à
 * navegação entre páginas nem aos redirects do middleware, mas o User-Agent
 * acompanha toda requisição que a WebView faz — inclusive a primeira, que é
 * justamente onde o gate de assinatura decide para onde mandar a pessoa.
 *
 * Mudar esta string exige mudar o capacitor.config.ts no mesmo commit. Se as
 * duas se separarem, a detecção passa a devolver `false` dentro do app, o
 * checkout reaparece e a próxima revisão da Apple reprova.
 */
export const MARCA_APP_IOS = "MimuApp/iOS";

/**
 * true quando a requisição veio de dentro do app iOS.
 *
 * Recebe o User-Agent em vez de ir buscá-lo sozinha para servir aos dois
 * lados: no servidor quem tem o valor é o `request.headers`, no navegador é
 * o `navigator.userAgent`. Uma função só, mesma resposta nos dois lugares —
 * o contrário seria ter duas regras que podem discordar, e é discordância
 * assim que faz um preço aparecer no app.
 */
export function ehAppIOS(userAgent: string | null | undefined): boolean {
  return typeof userAgent === "string" && userAgent.includes(MARCA_APP_IOS);
}

/**
 * O mesmo, lido do navegador.
 *
 * Devolve `false` no servidor (onde `navigator` não existe) de propósito: no
 * SSR quem manda é a versão que recebe o cabeçalho. Um componente que
 * precise da resposta antes da hidratação deve recebê-la por prop, vinda do
 * servidor, e não chamar isto.
 */
export function ehAppIOSNoNavegador(): boolean {
  if (typeof navigator === "undefined") return false;
  return ehAppIOS(navigator.userAgent);
}
