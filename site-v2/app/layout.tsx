/* Gerado por tools/gen-app.mjs — metadados lidos do <head> do clone. */

import type { Metadata } from 'next';
import Script from 'next/script';
import './webflow.css';

export const metadata: Metadata = {
  title: "Pierre - Assistente Financeiro",
  description: "Tudo o que entra e sai da sua conta, organizado e fazendo sentido. Sem planilha, sem susto no fim do mês, sem dor de cabeça.",
  openGraph: {
    title: "Pierre - Assistente Financeiro",
    description: "Tudo o que entra e sai da sua conta, organizado e fazendo sentido. Sem planilha, sem susto no fim do mês, sem dor de cabeça.",
    type: 'website',
    images: ["/assets/img/6a6a5453fadb67c111129b25_OpenGraph_pierre.webp"],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Pierre - Assistente Financeiro",
    description: "Tudo o que entra e sai da sua conta, organizado e fazendo sentido. Sem planilha, sem susto no fim do mês, sem dor de cabeça.",
    images: ["/assets/img/6a6a5453fadb67c111129b25_OpenGraph_pierre.webp"],
  },
  icons: {
    icon: "/assets/img/6980bc9b4a3eb99dbb38dade_Favicon.png",
    apple: "/assets/img/6980bcec2a9437173724de91_Webclip.png",
  },
  alternates: {
    languages: {
      "x-default": "https://lp.pierre.finance/",
      "pt-BR": "https://lp.pierre.finance/",
      "en": "https://lp.pierre.finance/en",
    },
  },
  other: { generator: 'Webflow' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="u-theme-dark">
        {/* Reproduz o detector de JS/touch do Webflow, que no original
            roda no <head> e adiciona as classes w-mod-* em <html>. */}
        <Script id="wf-mod" strategy="beforeInteractive">
          {`!function(o,c){var n=c.documentElement,t=" w-mod-";n.className+=t+"js",("ontouchstart"in o||o.DocumentTouch&&c instanceof DocumentTouch)&&(n.className+=t+"touch")}(window,document);`}
        </Script>
        {/* Aplica a classe de banner escondido antes da pintura, como no
            original (o listener de clique fica em components/behaviors). */}
        <Script id="hide-nav-banner" strategy="beforeInteractive">
          {`if(sessionStorage.getItem("hide-nav-banner")==="true"){document.documentElement.classList.add("hide-nav-banner");}`}
        </Script>
        <Script
          id="vendor-0"
          src="/assets/js/jquery-3.5.1.min.dc5e7f18c8.js"
          strategy="beforeInteractive"
        />
        <Script
          id="vendor-1"
          src="/assets/js/webflow.schunk.36b8fb49256177c8.js"
          strategy="beforeInteractive"
        />
        <Script
          id="vendor-2"
          src="/assets/js/webflow.schunk.f8d5d85e975717cd.js"
          strategy="beforeInteractive"
        />
        <Script
          id="vendor-3"
          src="/assets/js/webflow.0225a082.3890fba5f3ef210d.js"
          strategy="beforeInteractive"
        />
        <Script
          id="vendor-4"
          src="/assets/js/gsap.min.js"
          strategy="beforeInteractive"
        />
        <Script
          id="vendor-5"
          src="/assets/js/lenis.min.js"
          strategy="beforeInteractive"
        />
        <Script
          id="qr-code-styling"
          src="/assets/js/qr-code-styling.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
