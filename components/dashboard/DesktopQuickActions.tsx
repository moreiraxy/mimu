"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Minus, Plus, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const ACOES = [
  { label: "Nova venda", icone: Plus, href: "/financeiro/nova-entrada" },
  { label: "Nova despesa", icone: Minus, href: "/financeiro/nova-saida" },
  { label: "Novo agendamento", icone: Calendar, href: "/agenda/novo" },
  { label: "Novo cliente", icone: User, href: "/clientes/novo" },
  { label: "Falar com a Mimu", icone: Sparkles, href: "/mimu" },
] as const;

/** Substitui o FAB flutuante em telas grandes — mesmo menu, ancorado no header. */
export function DesktopQuickActions() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function selecionar(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <div className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 rounded-button bg-primary px-4 py-2.5 text-sm font-bold text-primary-text shadow-sm transition-colors hover:bg-primary-hover"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Nova ação
      </button>

      {open && (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-[calc(100%+8px)] z-50 flex w-64 flex-col gap-1 rounded-card border border-neutro-border bg-superficie p-2 shadow-lg">
            {ACOES.map((acao) => (
              <button
                key={acao.label}
                type="button"
                onClick={() => selecionar(acao.href)}
                className={cn(
                  "flex items-center gap-3 rounded-button px-3 py-2.5 text-left text-sm font-semibold text-escuro transition-colors hover:bg-fundo",
                )}
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-primary-forte">
                  <acao.icone className="h-4 w-4" strokeWidth={2.25} />
                </span>
                {acao.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
