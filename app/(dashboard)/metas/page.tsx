"use client";

import { useState } from "react";
import { Settings2 } from "lucide-react";
import { useMetas } from "@/hooks/useMetas";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProgressoCard } from "./ProgressoCard";
import { SecundariosCards } from "./SecundariosCards";
import { HistoricoCard } from "./HistoricoCard";
import { AjustarMetaModal } from "./AjustarMetaModal";

export default function MetasPage() {
  const { dados, loading, error, ajustarMeta } = useMetas();
  const { showToast } = useToast();
  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar(novoValor: number) {
    setSalvando(true);
    const ok = await ajustarMeta(novoValor);
    setSalvando(false);
    if (!ok) {
      showToast("Não consegui salvar a meta.");
      return;
    }
    showToast("Meta atualizada!");
    setModalAberto(false);
  }

  if (loading || !dados) {
    return (
      <div className="lg:mx-auto lg:max-w-5xl">
        <PageHeader title="Metas" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-52 w-full rounded-[20px]" />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Skeleton className="h-24 w-full rounded-card" />
            <Skeleton className="h-24 w-full rounded-card" />
            <Skeleton className="hidden h-24 w-full rounded-card lg:block" />
          </div>
          <Skeleton className="h-64 w-full rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:mx-auto lg:max-w-5xl">
        <PageHeader title="Metas" />
        <p className="text-center text-sm text-neutro-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:max-w-5xl">
      {/* SEM <FadeIn> AQUI: a transição de opacidade faz do elemento um
          "backdrop root" enquanto roda, e todo o vidro de dentro perde o
          desfoque por 150ms a cada navegação — a tela entra chapada e só
          então vira vidro. É o mesmo motivo comentado em dashboard/page.tsx. */}
      <PageHeader
        title="Metas"
        action={
          <button
            type="button"
            onClick={() => setModalAberto(true)}
            aria-label="Ajustar meta"
            className="flex h-9 w-9 items-center justify-center rounded-full text-primary-forte transition-colors hover:bg-primary-light"
          >
            <Settings2 className="h-5 w-5" strokeWidth={2.25} />
          </button>
        }
      />

      <div className="flex flex-col gap-4">
        <ProgressoCard
          realizado={dados.realizadoMes}
          meta={dados.metaMensal}
          progresso={dados.progressoMeta}
          projecaoFechamento={dados.projecaoFechamento}
        />

        <SecundariosCards
          metaDiaria={dados.metaDiaria}
          melhorDia={dados.melhorDia}
          realizadoMesAnterior={dados.realizadoMesAnterior}
          variacaoPercentual={dados.variacaoPercentual}
        />

        <HistoricoCard historico={dados.historico} />
      </div>

      <AjustarMetaModal
        open={modalAberto}
        metaAtual={dados.metaMensal}
        salvando={salvando}
        onSalvar={handleSalvar}
        onFechar={() => setModalAberto(false)}
      />
    </div>
  );
}
