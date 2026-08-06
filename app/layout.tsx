import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { OfflineProvider } from "@/components/providers/OfflineProvider";
import { AlertasProvider } from "@/components/providers/AlertasProvider";
import { OfflineBanner } from "@/components/OfflineBanner";
import { SilenciarConsoleProducao } from "@/components/providers/SilenciarConsoleProducao";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mimu — seu negócio, organizado",
  description:
    "Assistente de gestão para microempreendedores de bairro: vendas, faturamento, agenda e clientes em um só lugar.",
  applicationName: "Mimu",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Mimu",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B5B",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={nunito.variable}>
      <head>
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
