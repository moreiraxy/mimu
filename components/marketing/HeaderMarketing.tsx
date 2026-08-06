"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

export function HeaderMarketing() {
  const [rolado, setRolado] = useState(false);

  useEffect(() => {
    function aoRolar() {
      setRolado(window.scrollY > 8);
    }
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300",
        rolado
          ? "border-b border-neutro-border/60 bg-fundo/70 shadow-sm backdrop-blur-xl backdrop-saturate-150"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Logo size="sm" />

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-button border-[1.5px] border-neutro-border px-3 py-2 text-xs font-bold text-escuro transition-transform duration-150 active:scale-[0.97] sm:px-4 sm:text-sm"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="rounded-button bg-coral px-3 py-2 text-xs font-bold text-white transition-transform duration-150 hover:bg-coral-hover active:scale-[0.97] sm:px-4 sm:text-sm"
          >
            Começar grátis
          </Link>
        </div>
      </div>
    </header>
  );
}
