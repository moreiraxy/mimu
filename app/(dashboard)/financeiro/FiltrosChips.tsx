"use client";

import { cn } from "@/lib/utils";
import { FILTROS, type FiltroTransacao } from "./filtros";

export function FiltrosChips({
  ativo,
  onChange,
}: {
  ativo: FiltroTransacao;
  onChange: (filtro: FiltroTransacao) => void;
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto scroll-fade-x px-4 pb-1">
      {FILTROS.map((filtro) => (
        <button
          key={filtro}
          type="button"
          onClick={() => onChange(filtro)}
          className={cn(
            "flex-shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
            ativo === filtro
              ? "bg-primary/20 text-primary-forte"
              : "vidro-card text-escuro",
          )}
        >
          {filtro}
        </button>
      ))}
    </div>
  );
}
