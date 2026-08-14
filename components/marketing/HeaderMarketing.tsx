"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { LogoMark } from "@/components/Logo";

const LINKS = [
  { href: "#produto", label: "Produto" },
  { href: "#preco", label: "Preço" },
  { href: "#depoimentos", label: "Depoimentos" },
] as const;

export function HeaderMarketing() {
  const [aberto, setAberto] = useState(false);
  const reduzida = useReducedMotion();

  return (
    <>
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

          <div className="flex flex-shrink-0 items-center gap-2">
            <Link
              href="/cadastro"
              className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-text transition-transform duration-150 hover:bg-primary-hover active:scale-[0.97] sm:px-5 sm:text-[13px]"
            >
              Começar grátis
            </Link>
            <button
              type="button"
              onClick={() => setAberto(true)}
              aria-label="Abrir menu"
              aria-expanded={aberto}
              className="flex h-9 w-9 items-center justify-center rounded-full text-escuro transition-transform duration-150 active:scale-90 sm:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {aberto && (
          <div className="sm:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setAberto(false)}
              className="fixed inset-0 z-[60] bg-escuro/40"
            />
            <motion.div
              initial={{ opacity: 0, y: reduzida ? 0 : -24, scale: reduzida ? 1 : 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reduzida ? 0 : -24, scale: reduzida ? 1 : 0.96 }}
              transition={
                reduzida
                  ? { duration: 0.2 }
                  : { type: "spring", bounce: 0.2, duration: 0.5 }
              }
              className="fixed inset-x-4 top-4 z-[70] rounded-[24px] border border-neutro-border bg-superficie p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LogoMark size="sm" className="h-7 w-7 rounded-[8px]" />
                  <p className="text-base font-extrabold text-escuro">mimu</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAberto(false)}
                  aria-label="Fechar menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-escuro transition-transform duration-150 active:scale-90"
                >
                  <X className="h-5 w-5" strokeWidth={2.25} />
                </button>
              </div>

              <nav className="mt-6 flex flex-col gap-1">
                {LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setAberto(false)}
                    className="rounded-2xl px-3 py-3.5 text-lg font-bold text-escuro transition-colors active:bg-fundo"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="mt-5 flex flex-col gap-2.5">
                <Link
                  href="/login"
                  onClick={() => setAberto(false)}
                  className="flex items-center justify-center rounded-full border-[1.5px] border-escuro bg-transparent py-3 text-sm font-bold text-escuro transition-transform duration-150 active:scale-[0.97]"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  onClick={() => setAberto(false)}
                  className="flex items-center justify-center rounded-full bg-primary py-3 text-sm font-bold text-primary-text transition-transform duration-150 active:scale-[0.97]"
                >
                  Começar grátis
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
