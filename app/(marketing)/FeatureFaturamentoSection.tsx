"use client";

import Link from "next/link";
import { useState } from "react";
import { motion } from "motion/react";
import { SpringIn } from "@/components/marketing/SpringIn";
import { ParallaxFloat } from "@/components/marketing/ParallaxFloat";
import { EntradaMockup } from "@/components/marketing/EntradaMockup";
import { ContagemNumero } from "@/components/marketing/ContagemNumero";

const AGENDA = [
  { nome: "Maria · Escova", quando: "14h · R$ 120", cor: "bg-verde" },
  { nome: "Carol · Manicure", quando: "16h · R$ 90", cor: "bg-ambar" },
] as const;

const formatarReais = (n: number) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`;

export function FeatureFaturamentoSection() {
  const [entrou, setEntrou] = useState(false);
  const [contagemAtiva, setContagemAtiva] = useState(false);

  return (
    <section id="produto" className="px-4 py-[48px] sm:px-6 lg:py-[80px]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-14 lg:flex-row lg:gap-20">
        <ParallaxFloat strength={30} className="w-full max-w-[380px] flex-1">
          <EntradaMockup
            onEntrada={() => {
              setEntrou(true);
              setTimeout(() => setContagemAtiva(true), 400);
            }}
          >
            <div className="rounded-2xl bg-superficie p-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-escuro">Faturamento</span>
                <div className="flex gap-1 rounded-full bg-fundo p-1 text-[11px] font-bold text-neutro-muted">
                  <span className="rounded-full bg-superficie px-2.5 py-1 text-escuro shadow-sm">Hoje</span>
                  <span className="px-2.5 py-1">Semana</span>
                  <span className="px-2.5 py-1">Mês</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-verde-light p-4">
                  <p className="text-xs text-neutro-muted">Realizado</p>
                  <p className="mt-1 text-xl font-extrabold text-verde-texto">
                    <ContagemNumero valor={410} formatar={formatarReais} ativo={contagemAtiva} duracao={1300} />
                  </p>
                </div>
                <div className="rounded-xl bg-ambar-light p-4">
                  <p className="text-xs text-neutro-muted">Previsto</p>
                  <p className="mt-1 text-xl font-extrabold text-ambar-texto">
                    <ContagemNumero valor={90} formatar={formatarReais} ativo={contagemAtiva} duracao={1000} />
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2.5 border-t border-neutro-border pt-4">
                {AGENDA.map((item, indice) => (
                  <motion.div
                    key={item.nome}
                    initial={{ opacity: 0, x: -10 }}
                    animate={entrou ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.35, delay: indice * 0.15, ease: "easeOut" }}
                    className="flex items-center gap-2.5"
                  >
                    <span className={`h-2 w-2 flex-shrink-0 rounded-full ${item.cor}`} />
                    <p className="flex-1 text-sm text-escuro">{item.nome}</p>
                    <p className="text-sm text-neutro-muted">{item.quando}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </EntradaMockup>
        </ParallaxFloat>

        <SpringIn delay={0.1} className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary-forte">
            Faturamento previsto
          </p>
          <h2 className="mt-4 max-w-md font-display text-[1.6rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
            Sabe quanto vai entrar antes de entrar.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutro-muted sm:text-base">
            Eu cruzo sua agenda com seu histórico e mostro o que já é certo
            e o que ainda é previsão, pra você planejar sem susto.
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
