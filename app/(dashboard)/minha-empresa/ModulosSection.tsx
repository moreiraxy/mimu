"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { Toggle } from "@/components/ui/Toggle";
import { MODULOS, cartaoIdsParaChaves, chavesParaCartaoIds } from "@/lib/modulos";
import { SectionCard } from "./SectionCard";
import type { Empresa } from "@/types";

export function ModulosSection({
  empresa,
  onAtualizado,
}: {
  empresa: Empresa;
  onAtualizado: (empresa: Empresa) => void;
}) {
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());
  const [ativos, setAtivos] = useState<string[]>(() =>
    chavesParaCartaoIds(empresa.modulos_ativos),
  );
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  async function alternar(id: string) {
    const novoAtivos = ativos.includes(id)
      ? ativos.filter((x) => x !== id)
      : [...ativos, id];

    if (novoAtivos.length === 0) {
      showToast("Deixe pelo menos um módulo ativo.");
      return;
    }

    setSalvandoId(id);
    const chaves = cartaoIdsParaChaves(novoAtivos);

    const { error } = await supabase
      .from("empresas")
      .update({ modulos_ativos: chaves })
      .eq("id", empresa.id);

    setSalvandoId(null);

    if (error) {
      showToast("Não consegui salvar.");
      return;
    }

    setAtivos(novoAtivos);
    onAtualizado({ ...empresa, modulos_ativos: chaves });
  }

  return (
    <SectionCard
      icone={LayoutGrid}
      titulo="Módulos ativos"
      descricao="Desativar um módulo esconde ele do menu — os dados continuam guardados."
    >
      <div className="flex flex-col divide-y divide-neutro-border rounded-button border border-neutro-border">
        {MODULOS.map((modulo) => (
          <div
            key={modulo.id}
            className="flex items-center gap-3 px-3.5 py-3"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-coral-light text-coral">
              <modulo.icone className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-escuro">
                {modulo.label}
              </p>
              <p className="text-xs text-neutro-muted">{modulo.descricao}</p>
            </div>
            <Toggle
              checked={ativos.includes(modulo.id)}
              onChange={() => alternar(modulo.id)}
              label={modulo.label}
            />
          </div>
        ))}
      </div>
      {salvandoId && (
        <p className="mt-2 text-xs text-neutro-muted">Salvando...</p>
      )}
    </SectionCard>
  );
}
