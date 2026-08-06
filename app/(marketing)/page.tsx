import { redirect } from "next/navigation";
import { getEmpresaAtual } from "@/lib/supabase";
import { HeaderMarketing } from "@/components/marketing/HeaderMarketing";
import { HeroSection } from "./HeroSection";
import { ProblemaSection } from "./ProblemaSection";
import { SolucaoSection } from "./SolucaoSection";
import { ComoFuncionaSection } from "./ComoFuncionaSection";
import { PrecoSection } from "./PrecoSection";
import { FooterMarketing } from "./FooterMarketing";

// Landing pública em "/" — quem já está logada vai direto pro painel, não
// faz sentido mostrar a página de vendas pra quem já é cliente.
export default async function LandingPage() {
  const { user } = await getEmpresaAtual();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div
      className="min-h-screen bg-fundo"
      style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
    >
      <HeaderMarketing />
      <main>
        <HeroSection />
        <ProblemaSection />
        <SolucaoSection />
        <ComoFuncionaSection />
        <PrecoSection />
      </main>
      <FooterMarketing />
    </div>
  );
}
