import { readFileSync } from "node:fs";

/*
 * O Supabase local, liberado SÓ no desenvolvimento.
 *
 * O `connect-src` abaixo só permite `https://*.supabase.co`, que é o endereço
 * do projeto hospedado. Quem roda o app contra o Supabase local (`supabase
 * start`, em 127.0.0.1) bate numa parede que não parece uma parede: o servidor
 * responde 200, a página monta, e cada busca do navegador é recusada em
 * silêncio pelo próprio Chrome. O sintoma é o app inteiro preso em esqueleto
 * de carregamento, sem erro no terminal — só um aviso no console que ninguém
 * está olhando.
 *
 * Fica preso a `NODE_ENV !== "production"` de propósito. Em produção o
 * `connect-src` continua exatamente como estava: nenhum endereço a mais.
 */
const emDesenvolvimento = process.env.NODE_ENV !== "production";
const SUPABASE_LOCAL = emDesenvolvimento
  ? " http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*"
  : "";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // sdk.mercadopago.com é o SDK que monta o formulário de cartão. Sem
      // liberar aqui, o navegador bloqueia o script, o formulário nunca
      // aparece e pagar com cartão fica impossível — que era o sintoma.
      // mlstatic.com é o CDN de onde esse SDK puxa os próprios pedaços.
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://sdk.mercadopago.com https://www.mercadopago.com https://*.mlstatic.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https:",
      // O SDK conversa com a API do Mercado Pago para transformar o número do
      // cartão num token. É justamente esse desenho que faz o cartão NÃO
      // passar pelo nosso servidor.
      "connect-src 'self' https://*.supabase.co https://api.groq.com https://api.mercadopago.com https://*.mercadolibre.com https://*.mercadopago.com https://*.mlstatic.com" +
        SUPABASE_LOCAL,
      "font-src 'self' https://*.mlstatic.com",
      // Os campos de cartão são iframes do próprio Mercado Pago: é o que
      // impede o número do cartão de encostar no nosso código.
      // Além dos campos de cartão, o Mercado Pago abre um iframe do
      // mercadolibre.com para a checagem antifraude do dispositivo. Bloqueado,
      // ele não some da tela mas a análise fica cega, e isso derruba
      // aprovação de cartão.
      "frame-src 'self' https://*.mercadopago.com https://*.mercadopago.com.br https://*.mercadolibre.com",
      "frame-ancestors 'none'",
      // Fecha três classes de ataque que nada aqui usa, e por isso custam
      // zero em quebra:
      //
      // base-uri impede que um <base> injetado reescreva o destino de todo
      // caminho relativo da página, mandando os scripts para outro servidor.
      //
      // form-action impede que um formulário injetado poste as credenciais
      // digitadas em domínio de terceiro.
      //
      // object-src corta <object>, <embed> e <applet>, que são caminhos
      // antigos de execução e não existem no produto.
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

/*
 * A versão da Mimu, lida do package.json na hora do build.
 *
 * Ela aparece no rodapé das configurações — é o número que a pessoa lê para o
 * suporte quando algo dá errado, e é o que diz se ela já está na correção que
 * acabou de sair. Digitá-lo à mão numa tela garante o dia em que ele mente.
 *
 * `NEXT_PUBLIC_` porque quem mostra é um componente de cliente, e o valor é
 * gravado no bundle durante a compilação — não há nada para configurar em
 * painel de hospedagem nenhum.
 */
const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_VERSAO: pkg.version,
  },
  experimental: {
    /**
     * Liga o instrumentation.ts, que roda uma vez quando o servidor sobe.
     * No Next 14 este gancho ainda é experimental e precisa ser pedido; sem
     * esta linha o arquivo é simplesmente ignorado, sem erro nenhum.
     */
    instrumentationHook: true,
  },
  /**
   * A landing page é um projeto Vite separado (site-mimo), compilado a cada
   * build para dentro do public/ daqui. Estas reescritas fazem o Next servir
   * o HTML dela nas rotas públicas, sem que ela precise virar página Next.
   *
   * `beforeFiles` porque `/` também existe como rota do app: nesta fase a
   * reescrita vence, e a página antiga de marketing deixa de ser servida.
   *
   * Só as rotas da LP entram aqui. /cadastro, /login e o app inteiro seguem
   * sendo do Next — é para lá que os botões da landing apontam.
   */
  async rewrites() {
    /*
     * Cada rota da landing tem o SEU arquivo, e não mais um lp.html para
     * todas.
     *
     * Antes as quatro apontavam para o mesmo arquivo, e podiam: o HTML era
     * vazio em qualquer uma delas, e quem montava a página certa era o React
     * depois de carregar. O preço era o buscador ler quatro páginas idênticas
     * e sem texto.
     *
     * Agora o build gera um HTML por rota, com o texto, o título e o canonical
     * daquela página. Mandar todas para o mesmo arquivo de novo faria a
     * história do Salão da Andréia ser indexada com o conteúdo da home.
     */
    return {
      beforeFiles: [
        { source: "/", destination: "/lp.html" },
        { source: "/historias", destination: "/lp/historias.html" },
        { source: "/historias/:slug", destination: "/lp/historias/:slug.html" },
        { source: "/legal/:slug", destination: "/lp/legal/:slug.html" },
      ],
    };
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
