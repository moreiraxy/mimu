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
      "connect-src 'self' https://*.supabase.co https://api.groq.com https://api.mercadopago.com https://*.mercadolibre.com https://*.mercadopago.com https://*.mlstatic.com",
      "font-src 'self' https://*.mlstatic.com",
      // Os campos de cartão são iframes do próprio Mercado Pago: é o que
      // impede o número do cartão de encostar no nosso código.
      // Além dos campos de cartão, o Mercado Pago abre um iframe do
      // mercadolibre.com para a checagem antifraude do dispositivo. Bloqueado,
      // ele não some da tela mas a análise fica cega, e isso derruba
      // aprovação de cartão.
      "frame-src 'self' https://*.mercadopago.com https://*.mercadopago.com.br https://*.mercadolibre.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    const paginaDaLanding = "/lp.html";
    return {
      beforeFiles: [
        { source: "/", destination: paginaDaLanding },
        { source: "/historias", destination: paginaDaLanding },
        { source: "/historias/:slug", destination: paginaDaLanding },
        { source: "/legal/:slug", destination: paginaDaLanding },
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
