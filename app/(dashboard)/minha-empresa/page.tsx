"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { DadosNegocioSection } from "./DadosNegocioSection";
import { CategoriasSection } from "./CategoriasSection";
import { MetaSection } from "./MetaSection";
import { ModulosSection } from "./ModulosSection";
import { PreferenciasSection } from "./PreferenciasSection";
import { ContaSection } from "./ContaSection";
import type { Empresa } from "@/types";

export default function MinhaEmpresaPage() {
  const { empresa: empresaAuth, loading } = useAuth();
  const [empresaLocal, setEmpresaLocal] = useState<Empresa | null>(null);

  const empresa = empresaLocal ?? empresaAuth;

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
        <DadosNegocioSection empresa={empresa} onAtualizado={setEmpresaLocal} />
        <CategoriasSection />
        <MetaSection empresa={empresa} onAtualizado={setEmpresaLocal} />
        <ModulosSection empresa={empresa} onAtualizado={setEmpresaLocal} />
        <PreferenciasSection empresa={empresa} onAtualizado={setEmpresaLocal} />
        <ContaSection empresa={empresa} />
      </div>
    </div>
  );
}
