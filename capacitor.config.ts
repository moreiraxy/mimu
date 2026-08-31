import type { CapacitorConfig } from "@capacitor/cli";
import { MARCA_APP_IOS } from "./lib/plataforma";

/**
 * O app iOS da Mimu.
 *
 * A Mimu roda com SSR e Server Actions, então não existe bundle estático para
 * empacotar: o app carrega a Mimu hospedada dentro de uma WKWebView, e o que o
 * torna um app de verdade — e não um site embrulhado — é a camada nativa em
 * volta (push por APNs, câmera, Face ID, haptics). Essa camada é o que
 * responde pela diretriz 4.2 da Apple, "Minimum Functionality".
 */
/*
 * O endereço fica gravado DENTRO do aplicativo instalado.
 *
 * Não é como no site, onde trocar de domínio é mudar uma variável e
 * republicar: um app que já está no iPhone de alguém continua abrindo o
 * endereço com que foi compilado. Mudar exige nova versão, nova revisão da
 * Apple, e quem não atualizar fica com uma tela branca.
 *
 * A variável existe para o desenvolvimento e para a migração de domínio
 * poderem apontar para outro lugar. O padrão é a produção, de propósito: um
 * envio para a loja feito com a variável esquecida aponta para o lugar certo.
 */
const DOMINIO = process.env.CAPACITOR_DOMINIO ?? "mimu.pro";

const config: CapacitorConfig = {
  /*
   * O bundle id é definitivo: uma vez publicado, a App Store não deixa mudar.
   * Trocar exige criar outro app e perder as avaliações e os instalados.
   *
   * Está em br.com.mimu.app por convenção de DNS reverso. Se o domínio
   * definitivo da Mimu for outro, este é o momento de acertar — depois do
   * primeiro envio, não é mais.
   */
  appId: "br.com.mimu.app",
  appName: "Mimu",

  /*
   * Existe porque o Capacitor exige, não porque seja usado no dia a dia: com
   * `server.url` definido, quem manda na tela é o site hospedado. O que mora
   * aqui é a página que aparece quando o aparelho está sem internet e a
   * WebView não consegue alcançar o servidor — sem ela, a pessoa vê a tela
   * branca do Safari, que parece o app quebrado.
   */
  webDir: "app-shell",

  server: {
    /*
     * A Mimu hospedada. Precisa ser HTTPS: o App Transport Security do iOS
     * bloqueia HTTP puro, e o sintoma é tela branca sem mensagem de erro.
     *
     * Trocar por um endereço de teste durante o desenvolvimento é normal —
     * mas nunca enviar para a loja apontando para outro lugar que não a
     * produção.
     */
    url: `https://${DOMINIO}`,
    // O certificado é válido; aceitar inválido só serviria para esconder um
    // problema de infraestrutura até ele aparecer na mão de um cliente.
    allowNavigation: [DOMINIO],
  },

  ios: {
    /*
     * ESTA LINHA É O QUE MANTÉM O APP PUBLICÁVEL.
     *
     * É por esta marca no User-Agent que o servidor sabe que a requisição veio
     * de dentro do app. É isso que troca o checkout do Mercado Pago pelo
     * In-App Purchase e apaga qualquer link para o site que fale de pagamento
     * — as duas coisas que a diretriz 3.1.1 exige de quem vende assinatura
     * digital dentro de um app iOS.
     *
     * A string vem de lib/plataforma.ts de propósito, importada e não copiada:
     * se as duas pontas se separarem, a detecção passa a devolver `false`
     * dentro do app, o checkout do Mercado Pago reaparece e a próxima revisão
     * reprova. Um literal aqui deixaria isso acontecer em silêncio.
     */
    appendUserAgent: MARCA_APP_IOS,

    /*
     * O fundo que aparece atrás da WebView enquanto a página carrega e no
     * repique do scroll. Acompanha o background_color do manifest: com o
     * branco padrão, cada rolagem além do fim pisca branco num app de fundo
     * escuro.
     */
    backgroundColor: "#0A0A0A",

    // O gesto de voltar arrastando da borda, que no iOS as pessoas usam sem
    // pensar. Desligado, o app parece travado em telas internas.
    limitsNavigationsToAppBoundDomains: false,
  },
};

export default config;
