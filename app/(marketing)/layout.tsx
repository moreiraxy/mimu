import { SmoothScroll } from "@/components/marketing/SmoothScroll";

// Sem wrapper visual de propósito — a landing page (page.tsx) precisa de
// largura cheia e seções com fundos diferentes; as telas de assinatura
// (assinar/*, trial-vencido) já levam o próprio wrapper "centralizado,
// fundo coral suave" direto no corpo de cada uma. O SmoothScroll é a única
// coisa que este layout adiciona de fato — smooth-scroll pra toda a landing.
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SmoothScroll>{children}</SmoothScroll>;
}
