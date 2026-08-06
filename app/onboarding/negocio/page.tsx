import { getEmpresaAtual } from "@/lib/onboarding";
import { NegocioForm } from "./negocio-form";

export default async function OnboardingNegocioPage() {
  const { empresa } = await getEmpresaAtual();

  return <NegocioForm tipoNegocioAtual={empresa?.tipo_negocio ?? null} />;
}
