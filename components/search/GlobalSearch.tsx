"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { SearchOverlay } from "./SearchOverlay";

/** Ícone de busca presente no topo de toda tela autenticada — abre o overlay de busca global. */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Buscar"
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-neutro-border bg-superficie text-neutro-muted-strong transition-colors hover:bg-fundo"
      >
        <Search className="h-[18px] w-[18px]" strokeWidth={2.25} />
      </button>
      <SearchOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
