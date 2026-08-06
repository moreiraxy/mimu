import { redirect } from "next/navigation";
import { getEmpresaAtual } from "@/lib/supabase";
import { HeaderMarketing } from "@/components/marketing/HeaderMarketing";
import { HeroSection } from "./HeroSection";
import { MetricasSection } from "./MetricasSection";
import { ChegaDePlanilhaSection } from "./ChegaDePlanilhaSection";
import { FeatureFaturamentoSection } from "./FeatureFaturamentoSection";
import { FeatureMimuChatSection } from "./FeatureMimuChatSection";
import { FeatureClientesFieisSection } from "./FeatureClientesFieisSection";
import { DepoimentosSection } from "./DepoimentosSection";
import { PrecoSection } from "./PrecoSection";
import { CadernoPlanilhaMemoriaSection } from "./CadernoPlanilhaMemoriaSection";
import { FooterMarketing } from "./FooterMarketing";

// Landing pública em "/" — quem já está logada vai direto pro painel, não
// faz sentido mostrar a página de vendas pra quem já é cliente.
export default async function LandingPage() {
  const { user } = await getEmpresaAtual();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-fundo">
      <HeaderMarketing />
      <main>
        <HeroSection />
        <MetricasSection />
        <ChegaDePlanilhaSection />
        <FeatureFaturamentoSection />
        <FeatureMimuChatSection />
        <FeatureClientesFieisSection />
        <DepoimentosSection />
        <PrecoSection />
        <CadernoPlanilhaMemoriaSection />
      </main>
      <FooterMarketing />
    </div>
  );
}
