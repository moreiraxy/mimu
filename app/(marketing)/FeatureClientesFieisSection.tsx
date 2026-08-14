"use client";

import Link from "next/link";
import { useState } from "react";
import { Star } from "lucide-react";
import { SpringIn } from "@/components/marketing/SpringIn";
import { ParallaxFloat } from "@/components/marketing/ParallaxFloat";
import { EntradaMockup } from "@/components/marketing/EntradaMockup";
import { ContagemNumero } from "@/components/marketing/ContagemNumero";

const STATS = [
  { valor: 47, formatar: (n: number) => Math.round(n).toString(), label: "visitas" },
  {
    valor: 4820,
    formatar: (n: number) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`,
    label: "gasto total",
  },
  { valor: 12, formatar: (n: number) => `${Math.round(n)} dias`, label: "frequência" },
] as const;

export function FeatureClientesFieisSection() {
  const [contagemAtiva, setContagemAtiva] = useState(false);

  return (
    <section className="px-4 py-[48px] sm:px-6 lg:py-[80px]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-14 lg:flex-row lg:gap-20">
        <ParallaxFloat strength={30} className="w-full max-w-[380px] flex-1">
          <EntradaMockup onEntrada={() => setTimeout(() => setContagemAtiva(true), 400)}>
            <div className="rounded-2xl bg-superficie p-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
              <div className="flex items-center gap-3 border-b border-neutro-border pb-4">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-text">
                  MG
                </span>
                <div>
                  <p className="text-sm font-bold text-escuro">Maria das Graças</p>
                  <span className="mt-1 inline-flex animate-pulse-badge items-center gap-1 rounded-full bg-ambar-soft px-2 py-0.5 text-[10px] font-bold text-ambar-texto">
                    <Star className="h-2.5 w-2.5 fill-ambar-text" strokeWidth={0} />
                    Cliente Fiel
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {STATS.map((stat, indice) => (
                  <div key={stat.label} className="rounded-xl bg-fundo px-2 py-3">
                    <p className="text-base font-extrabold text-escuro">
                      <ContagemNumero
                        valor={stat.valor}
                        formatar={stat.formatar}
                        ativo={contagemAtiva}
                        duracao={1000 + indice * 200}
                      />
                    </p>
                    <p className="mt-0.5 text-[11px] text-neutro-muted">{stat.label}</p>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-center text-xs text-neutro-muted">
                Último atendimento: 15 dias atrás
              </p>
            </div>
          </EntradaMockup>
        </ParallaxFloat>

        <SpringIn delay={0.1} className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary-forte">
            Clientes fiéis
          </p>
          <h2 className="mt-4 max-w-md font-display text-[1.6rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
            Reconhece quem sempre volta.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutro-muted sm:text-base">
            A Mimu identifica automaticamente seus clientes mais fiéis, para
            você tratar cada um do jeito que ele merece.
          </p>
          <Link
            href="/cadastro"
            className="mt-7 inline-flex items-center justify-center rounded-full border-[1.5px] border-primary-forte px-7 py-3 text-sm font-bold text-primary-forte transition-colors duration-200 hover:bg-primary hover:text-primary-text active:scale-[0.97]"
          >
            Começar grátis
          </Link>
        </SpringIn>
      </div>
    </section>
  );
}
