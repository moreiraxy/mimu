// Sem wrapper de propósito — a landing page (page.tsx) precisa de largura
// cheia e seções com fundos diferentes; as telas de assinatura (assinar/*,
// trial-vencido) já levam o próprio wrapper "centralizado, fundo coral
// suave" direto no corpo de cada uma.
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
