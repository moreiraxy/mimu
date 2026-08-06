import { redirect } from "next/navigation";
import { getEmpresaAtual } from "@/lib/onboarding";

// Layout já garante usuário autenticado e onboarding não concluído — aqui só
// decidimos em qual dos 3 passos a pessoa deve continuar.
export default async function OnboardingIndexPage() {
  const { empresa } = await getEmpresaAtual();

  if (!empresa?.tipo_negocio) {
    redirect("/onboarding/negocio");
  }
  if (!empresa.modulos_ativos || empresa.modulos_ativos.length === 0) {
    redirect("/onboarding/modulos");
  }
  redirect("/onboarding/meta");
}
