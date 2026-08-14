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
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https:",
      "connect-src 'self' https://*.supabase.co https://api.groq.com",
      "font-src 'self'",
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
