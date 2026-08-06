import { redirect } from "next/navigation";
import { getEmpresaAtual } from "@/lib/onboarding";
import { ModulosForm } from "./modulos-form";

export default async function OnboardingModulosPage() {
  const { empresa } = await getEmpresaAtual();

  if (!empresa?.tipo_negocio) {
    redirect("/onboarding/negocio");
  }

  return (
    <ModulosForm
      tipoNegocio={empresa.tipo_negocio}
      modulosAtuais={empresa.modulos_ativos ?? []}
    />
  );
}
