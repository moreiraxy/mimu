"use client";

import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { DadosNegocioSection } from "./DadosNegocioSection";
import { CategoriasSection } from "./CategoriasSection";
import { MetaSection } from "./MetaSection";
import { ModulosSection } from "./ModulosSection";
import { PreferenciasSection } from "./PreferenciasSection";
import { PlanoSection } from "./PlanoSection";
import { WhatsAppSection } from "./WhatsAppSection";
import { ContaSection } from "./ContaSection";
import { ExcluirContaSection } from "./ExcluirContaSection";

/**
 * Não há mais cópia local da empresa aqui.
 *
 * Havia, e o resultado de salvar ficava só nesta tela: o menu, a barra de
 * baixo e o painel continuavam com o valor antigo. Quem ligava um módulo
 * depois de já estar dentro não via o destino aparecer, e no caso da Mimu
 * ficava sem caminho nenhum para o chat.
 *
 * Agora quem guarda é o AuthProvider, que é quem o app inteiro lê.
 */
export default function MinhaEmpresaPage() {
  const { empresa, loading, atualizarEmpresa } = useAuth();

  if (loading || !empresa) {
    return (
      <div className="lg:mx-auto lg:max-w-2xl">
        <PageHeader title="Minha empresa" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-64 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <PageHeader title="Minha empresa" />
      <div className="flex flex-col gap-4">
        <DadosNegocioSection empresa={empresa} onAtualizado={atualizarEmpresa} />
        <CategoriasSection />
        <MetaSection empresa={empresa} onAtualizado={atualizarEmpresa} />
        <ModulosSection empresa={empresa} onAtualizado={atualizarEmpresa} />
        <PreferenciasSection empresa={empresa} onAtualizado={atualizarEmpresa} />
        <WhatsAppSection />
        <PlanoSection />
        <ContaSection />
        <ExcluirContaSection empresa={empresa} />
      </div>
    </div>
  );
}
