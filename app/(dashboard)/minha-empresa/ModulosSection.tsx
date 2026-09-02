"use client";

import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Toggle } from "@/components/ui/Toggle";
import { MODULOS, chavesParaCartaoIds } from "@/lib/modulos";
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
  const [ativos, setAtivos] = useState<string[]>(() =>
    chavesParaCartaoIds(empresa.modulos_ativos),
  );
  const [salvandoId, setSalvandoId] = useState<string | null>(null);

  async function alternar(id: string) {
    const ligando = !ativos.includes(id);
    const novoAtivos = ligando
      ? [...ativos, id]
      : ativos.filter((x) => x !== id);

    if (novoAtivos.length === 0) {
      showToast("Deixe pelo menos um módulo ativo.");
      return;
    }

    setSalvandoId(id);

    /*
     * Mexe SÓ nas chaves do cartão tocado, partindo do que a conta já tem.
     *
     * Antes a lista era remontada do zero a partir dos cartões acesos, e
     * qualquer chave que não formasse um cartão inteiro desaparecia junto.
     * Uma conta com "agenda" sem "clientes" perdia a agenda ao ligar a Mimu,
     * sem nada avisar. Partindo do estado real e alterando só o que foi
     * clicado, o que a pessoa não tocou continua onde estava.
     */
    const modulo = MODULOS.find((m) => m.id === id);
    const chavesAtuais = new Set(empresa.modulos_ativos);
    for (const chave of modulo?.chaves ?? []) {
      if (ligando) chavesAtuais.add(chave);
      else chavesAtuais.delete(chave);
    }
    const chaves = Array.from(chavesAtuais);

    // Passa pelo servidor: `modulos_ativos` é o que separa os planos, e o
    // banco não deixa mais o navegador escrever nessa coluna.
    const resposta = await fetch("/api/empresa/modulos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modulos: chaves }),
    });

    setSalvandoId(null);

    if (!resposta.ok) {
      const { error } = await resposta.json().catch(() => ({ error: null }));
      showToast(error ?? "Não consegui salvar.");
      return;
    }

    setAtivos(novoAtivos);
    onAtualizado({ ...empresa, modulos_ativos: chaves });
  }

  return (
    <SectionCard
      icone={LayoutGrid}
      titulo="Módulos ativos"
      descricao="Desativar um módulo esconde ele do menu. Os dados continuam guardados."
    >
      <div className="vidro-card flex flex-col divide-y divide-white/[0.08] overflow-hidden rounded-[20px]">
        {MODULOS.map((modulo) => (
          <div
            key={modulo.id}
            className="flex items-center gap-3 px-3.5 py-3"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary-forte">
              <modulo.icone className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-bold text-escuro">
                {modulo.label}
              </p>
              <p className="mt-0.5 text-[13px] text-neutro-muted">{modulo.descricao}</p>
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
        <p className="mt-2 text-[13px] text-neutro-muted">Salvando...</p>
      )}
    </SectionCard>
  );
}
