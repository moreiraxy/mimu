"use client";

import Link from "next/link";
import { LogoMark } from "@/components/Logo";

const LINKS = [
  { href: "#produto", label: "Produto" },
  { href: "#preco", label: "Preço" },
  { href: "#depoimentos", label: "Depoimentos" },
] as const;

export function HeaderMarketing() {
  return (
    <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4 sm:top-5">
      <div className="flex w-full max-w-3xl items-center justify-between gap-2 rounded-full border border-neutro-border/60 bg-superficie/90 py-2 pl-3 pr-2 shadow-lg shadow-escuro/5 backdrop-blur-xl backdrop-saturate-150 sm:py-2.5 sm:pl-4 sm:pr-2.5">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          <LogoMark size="sm" className="h-7 w-7 rounded-[8px]" />
          <p className="text-base font-extrabold text-escuro">mimu</p>
        </Link>

        <nav className="hidden items-center gap-6 sm:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-bold text-neutro-muted-strong transition-colors hover:text-escuro"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link
          href="/cadastro"
          className="flex-shrink-0 rounded-full bg-coral px-4 py-2 text-xs font-bold text-white transition-transform duration-150 hover:bg-coral-hover active:scale-[0.97] sm:px-5 sm:text-[13px]"
        >
          Começar grátis
        </Link>
      </div>
    </div>
  );
}
