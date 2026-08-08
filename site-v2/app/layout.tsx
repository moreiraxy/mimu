/* Gerado por tools/gen-app.mjs — metadados lidos do <head> do clone. */

import type { Metadata } from 'next';
import Script from 'next/script';
import './webflow.css';
// Depois do webflow.css de propósito — sobrescreve os swatches do clone.
import './mimu-brand.css';

// Título e descrição espelham os do app (mimu/app/layout.tsx), para a landing
// e o PWA se apresentarem igual na busca e ao compartilhar.
const TITLE = "Mimu · seu negócio, organizado";
const DESCRIPTION =
  "Assistente de gestão para microempreendedores de bairro: vendas, faturamento, agenda e clientes em um só lugar.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Mimu",
  // Sem `images` em openGraph/twitter: o card do clone era arte da Pierre, e
  // publicar ele com o nome da Mimu seria material de marca de outra empresa.
  // Falta gerar um OG da Mimu (1200x630) e apontar aqui.
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
  },
  icons: {
    icon: "/assets/img/mimu-icon.svg",
    apple: "/assets/img/mimu-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className="u-theme-light">
        {/* Reproduz o detector de JS/touch do Webflow, que no original
            roda no <head> e adiciona as classes w-mod-* em <html>. */}
        <Script
          id="wf-mod"
          src="/assets/js/wf-mod.js"
          strategy="beforeInteractive"
        />
        {/* Aplica a classe de banner escondido antes da pintura, como no
            original (o listener de clique fica em components/behaviors). */}
        <Script
          id="hide-nav-banner"
          src="/assets/js/hide-nav-banner.js"
          strategy="beforeInteractive"
        />
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
