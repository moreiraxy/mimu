"use client";

import { useAuth } from "@/hooks/useAuth";
import { TelaDeAjuste } from "@/components/perfil/TelaDeAjuste";
import { Skeleton } from "@/components/ui/Skeleton";
import { DadosNegocioSection } from "../DadosNegocioSection";
import { CategoriasSection } from "../CategoriasSection";
import { MetaSection } from "../MetaSection";
import { ModulosSection } from "../ModulosSection";
import { ExcluirContaSection } from "../ExcluirContaSection";

/**
 * O negócio: nome, tipo, categorias, meta e o que fica ligado.
 *
 * São as quatro coisas que descrevem a empresa, e por isso continuam juntas
 * numa tela só — quem vem aqui costuma mexer em mais de uma na mesma visita.
 * O que saiu foram as que não descrevem nada: senha, plano, WhatsApp e
 * preferências, que agora têm cada uma a sua tela.
 *
 * Excluir a conta fica no fim, e só aqui. Antes ela morava no fim da página
 * única de ajustes, ou seja, TODA visita a ajustes terminava passando por
 * ela.
 */
export default function NegocioPage() {
  const { empresa, loading, atualizarEmpresa } = useAuth();

  if (loading || !empresa) {
    return (
      <TelaDeAjuste titulo="Perfil do negócio">
        <Skeleton className="h-64 w-full rounded-[18px]" />
        <Skeleton className="h-40 w-full rounded-[18px]" />
      </TelaDeAjuste>
    );
  }

  return (
    <TelaDeAjuste titulo="Perfil do negócio">
      <>
        <DadosNegocioSection empresa={empresa} onAtualizado={atualizarEmpresa} />
        <CategoriasSection />
        <MetaSection empresa={empresa} onAtualizado={atualizarEmpresa} />
        <ModulosSection empresa={empresa} onAtualizado={atualizarEmpresa} />
        <ExcluirContaSection empresa={empresa} />
      </>
    </TelaDeAjuste>
  );
}
