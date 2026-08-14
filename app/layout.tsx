import type { Metadata, Viewport } from "next";
import { URL_SITE } from "@/lib/site";
import localFont from "next/font/local";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { OfflineProvider } from "@/components/providers/OfflineProvider";
import { AlertasProvider } from "@/components/providers/AlertasProvider";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SilenciarConsoleProducao } from "@/components/providers/SilenciarConsoleProducao";
import "./globals.css";

// Auto-hospedadas em public/fonts (variable fonts baixadas do Google Fonts) —
// evita depender de rede durante build/dev, que já se mostrou instável neste
// ambiente com fonts.gstatic.com.
const nunito = localFont({
  src: "../public/fonts/nunito-variable.woff2",
  weight: "400 800",
  variable: "--font-nunito",
  display: "swap",
});

const spaceGrotesk = localFont({
  src: "../public/fonts/space-grotesk-variable.woff2",
  weight: "500 700",
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  // Base de todas as URLs relativas do metadata. Sem ela, o Next monta as
  // tags de compartilhamento com caminho relativo, e WhatsApp e redes sociais
  // não conseguem resolver a imagem nem o link.
  metadataBase: new URL(URL_SITE),
  title: {
    default: "Mimu · seu negócio, organizado",
    // As telas internas viram "Financeiro · Mimu" sem repetir a marca à mão.
    template: "%s · Mimu",
  },
  description:
    "Assistente de gestão para microempreendedores de bairro: vendas, faturamento, agenda e clientes em um só lugar.",
  applicationName: "Mimu",
  // Buscadores grandes ignoram keywords há anos. Ficam porque alguns
  // buscadores menores e ferramentas de IA ainda leem — custo zero, não
  // confundir com estratégia de SEO.
  keywords: [
    "gestão para microempreendedor",
    "aplicativo para MEI",
    "controle de vendas",
    "controle financeiro simples",
    "agenda para salão de beleza",
    "sistema para mercadinho",
    "caderninho digital",
    "controle de clientes",
    "fluxo de caixa para pequeno negócio",
    "app de gestão em português",
  ],
  authors: [{ name: "Mimu" }],
  creator: "Mimu",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Mimu",
    url: URL_SITE,
    title: "Mimu · seu negócio, organizado",
    description:
      "Vendas, faturamento, agenda e clientes num app só. Feito para quem hoje controla tudo no caderno ou na memória.",
    // Sem isto o link compartilhado no WhatsApp aparecia sem prévia nenhuma.
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Mimu: enquanto você trabalha, a Mimu cuida do seu negócio.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mimu · seu negócio, organizado",
    description:
      "Vendas, faturamento, agenda e clientes num app só. 7 dias grátis, sem cartão.",
    images: ["/og.png"],
  },
  icons: {
    // PNG antes do SVG: o navegador guarda favicon de forma agressiva, e
    // trocar só o conteúdo do /icon.svg deixava a aba com o ícone antigo.
    // Nome de arquivo novo força a busca.
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    // PNG e não SVG: o iOS ignora SVG em apple-touch-icon, e o resultado era
    // a tela de início do iPhone continuar mostrando o ícone antigo mesmo
    // depois da troca de marca. 180x180 é o tamanho que ele pede.
    apple: [{ url: "/icons/icon-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Mimu",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#CCFF00",
  width: "device-width",
  initialScale: 1,
  // Sem isso, o Chrome Android por padrão NÃO encolhe a viewport quando o
  // teclado virtual abre — qualquer altura em `vh` (ex.: o chat da Mimu)
  // continua medindo o tamanho da tela inteira, empurrando o input pra fora
  // da área visível atrás do teclado. Com `resizes-content`, a viewport (e
  // portanto `vh`/`dvh`) encolhe de verdade, e o layout normal do navegador
  // já rola o campo focado pra cima do teclado sozinho.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${nunito.variable} ${spaceGrotesk.variable}`}>
      <head>
        {process.env.NODE_ENV !== "production" && (
          // Script inline (não passa pelos chunks do webpack) que desregistra
          // qualquer service worker preso de uma sessão de dev anterior e
          // limpa o cache dele, recarregando uma vez se encontrar algo pra
          // limpar. Roda antes de qualquer chunk da página ser buscado, então
          // não depende do JS (potencialmente quebrado/cacheado) do bundle —
          // resolve sozinho o "localhost travado com JS antigo" sem precisar
          // de DevTools manual.
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){
                try {
                  if (!('serviceWorker' in navigator)) return;
                  navigator.serviceWorker.getRegistrations().then(function(regs) {
                    if (regs.length === 0) return;
                    Promise.all(regs.map(function(r) { return r.unregister(); })).then(function() {
                      var limpar = 'caches' in window
                        ? caches.keys().then(function(chaves) {
                            return Promise.all(chaves.map(function(c) { return caches.delete(c); }));
                          })
                        : Promise.resolve();
                      limpar.then(function() {
                        if (!sessionStorage.getItem('__mimu_sw_cleanup__')) {
                          sessionStorage.setItem('__mimu_sw_cleanup__', '1');
                          location.reload();
                        }
                      });
                    });
                  });
                } catch (e) {}
              })();`,
            }}
          />
        )}
        {/* Splash screens iOS — sem elas o Safari mostra tela branca ao abrir o app instalado */}
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-2048x2732.png"
          media="(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1668x2388.png"
          media="(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1536x2048.png"
          media="(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1125x2436.png"
          media="(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-1242x2208.png"
          media="(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-750x1334.png"
          media="(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)"
        />
        <link
          rel="apple-touch-startup-image"
          href="/splash/splash-640x1136.png"
          media="(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)"
        />
      </head>
      <body className="font-sans">
        <SilenciarConsoleProducao />
        <AuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <OfflineProvider>
                <AlertasProvider>
                  <OfflineBanner />
                  {children}
                </AlertasProvider>
              </OfflineProvider>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
