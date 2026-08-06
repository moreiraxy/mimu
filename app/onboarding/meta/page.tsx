import { redirect } from "next/navigation";
import { getEmpresaAtual } from "@/lib/onboarding";
import { MetaForm } from "./meta-form";

export default async function OnboardingMetaPage() {
  const { empresa } = await getEmpresaAtual();

  if (!empresa?.tipo_negocio) {
    redirect("/onboarding/negocio");
  }
  if (!empresa.modulos_ativos || empresa.modulos_ativos.length === 0) {
    redirect("/onboarding/modulos");
  }

  return (
    <MetaForm
      metaMensalAtual={empresa.meta_mensal}
      clientesPorSemanaAtual={empresa.clientes_por_semana_media}
    />
  );
}
