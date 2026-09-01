"use client";

import { useAuth } from "@/hooks/useAuth";
import { TelaDeAjuste } from "@/components/perfil/TelaDeAjuste";
import { Skeleton } from "@/components/ui/Skeleton";
import { PreferenciasSection } from "../PreferenciasSection";

export default function PreferenciasPage() {
  const { empresa, loading, atualizarEmpresa } = useAuth();

  return (
    <TelaDeAjuste titulo="Preferências">
      {loading || !empresa ? (
        <>
          <Skeleton className="h-20 w-full rounded-[18px]" />
          <Skeleton className="h-20 w-full rounded-[18px]" />
        </>
      ) : (
        <PreferenciasSection empresa={empresa} onAtualizado={atualizarEmpresa} />
      )}
    </TelaDeAjuste>
  );
}
