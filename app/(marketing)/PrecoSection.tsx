"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { SpringIn } from "@/components/marketing/SpringIn";
import { ParallaxFloat } from "@/components/marketing/ParallaxFloat";

type Periodo = "mensal" | "trimestral" | "semestral" | "anual";

const PLANOS: Record<
  Periodo,
  {
    label: string;
    valor: string;
    porMes: string;
    info: string;
    badge: string | null;
    badgeCor: "ambar" | "coral" | null;
    economia: string | null;
  }
> = {
  mensal: {
    label: "Mensal",
    valor: "R$ 39",
    porMes: "por mês",
    info: "Cobrado mensalmente",
    badge: null,
    badgeCor: null,
    economia: null,
  },
  trimestral: {
    label: "Trimestral",
    valor: "R$ 99",
    porMes: "R$ 33/mês",
    info: "Cobrado a cada 3 meses",
    badge: "1 mês grátis",
    badgeCor: "ambar",
    economia: null,
  },
  semestral: {
    label: "Semestral",
    valor: "R$ 179",
    porMes: "R$ 30/mês",
    info: "Cobrado a cada 6 meses",
    badge: "Quase 2 meses grátis",
    badgeCor: "ambar",
    economia: null,
  },
  anual: {
    label: "Anual",
    valor: "R$ 299",
    porMes: "R$ 25/mês",
    info: "Cobrado uma vez por ano",
    badge: "Mais popular",
    badgeCor: "coral",
    economia: "4 meses grátis",
  },
} as const;

const TABELA: Array<{
  periodo: Periodo;
  total: string;
  porMes: string;
  economia: string | null;
  economiaCor: "verde" | "coral" | null;
}> = [
  { periodo: "mensal", total: "R$ 39", porMes: "R$ 39/mês", economia: null, economiaCor: null },
  { periodo: "trimestral", total: "R$ 99", porMes: "R$ 33/mês", economia: "R$ 72/ano", economiaCor: "verde" },
  { periodo: "semestral", total: "R$ 179", porMes: "R$ 30/mês", economia: "R$ 110/ano", economiaCor: "verde" },
  { periodo: "anual", total: "R$ 299", porMes: "R$ 25/mês", economia: "R$ 169/ano", economiaCor: "coral" },
];

const ITENS_INCLUIDOS = [
  "Agenda e clientes ilimitados",
  "Financeiro completo",
  "Faturamento previsto",
  "Assistente Mimu com IA",
  "Produtos e estoque",
  "Funciona offline",
] as const;

export function PrecoSection() {
  const [periodo, setPeriodo] = useState<Periodo>("anual");
  const plano = PLANOS[periodo];

  return (
    <section id="preco" className="px-5 py-16 sm:px-6 sm:py-24">
      <SpringIn>
        <h2 className="mx-auto max-w-xl text-center font-display text-[1.6rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
          Escolha como a Mimu vai cuidar do seu negócio.
        </h2>
      </SpringIn>
      <SpringIn delay={0.05}>
        <p className="mx-auto mt-3 max-w-sm text-center text-[15px] text-neutro-muted">
          7 dias grátis em qualquer plano. Sem cartão de crédito.
        </p>
      </SpringIn>

      <SpringIn delay={0.1}>
        <div className="mx-auto mt-8 flex w-fit gap-1 rounded-full border border-neutro-border bg-superficie p-1">
          {(Object.keys(PLANOS) as Periodo[]).map((chave) => (
            <button
              key={chave}
              onClick={() => setPeriodo(chave)}
              className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors duration-200 ${
                periodo === chave ? "bg-coral text-white" : "text-escuro"
              }`}
            >
              {PLANOS[chave].label}
            </button>
          ))}
        </div>
      </SpringIn>

      <ParallaxFloat strength={55} className="mx-auto max-w-md">
      <SpringIn delay={0.15}>
        <div className="relative mt-10 rounded-[26px] border-[1.5px] border-coral bg-coral-light px-8 py-11 text-center shadow-2xl shadow-coral/20">
          {plano.badge && (
            <span
              className={`absolute -top-3.5 left-8 rounded-full px-3.5 py-1.5 text-[11px] font-bold text-white ${
                plano.badgeCor === "coral" ? "animate-pulse-badge bg-coral" : "bg-ambar"
              }`}
            >
              {plano.badge}
            </span>
          )}
          {plano.economia && (
            <span className="absolute -top-3.5 right-6 whitespace-nowrap rounded-full bg-verde px-3 py-1.5 text-[10px] font-bold text-white">
              {plano.economia}
            </span>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={periodo}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <p className="font-display text-5xl font-bold tracking-tight text-escuro">
                {plano.valor}
              </p>
              <p className="mt-1.5 text-sm text-neutro-muted">{plano.porMes}</p>
              <p className="mt-1 text-[13px] text-neutro-muted">{plano.info}</p>
            </motion.div>
          </AnimatePresence>

          <ul className="mt-8 flex flex-col gap-3 text-left">
            {ITENS_INCLUIDOS.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <Check className="h-[17px] w-[17px] flex-shrink-0 text-verde" strokeWidth={2.6} />
                <p className="text-sm text-escuro">{item}</p>
              </li>
            ))}
          </ul>

          <Link
            href="/cadastro"
            className="mt-8 flex w-full items-center justify-center rounded-full bg-coral py-3.5 text-[15px] font-bold text-white shadow-lg shadow-coral/30 transition-transform duration-150 hover:bg-coral-hover active:scale-[0.97]"
          >
            Começar com 7 dias grátis
          </Link>
          <p className="mt-3 text-xs text-neutro-muted">
            Sem cartão de crédito. Cancele quando quiser.
          </p>
        </div>
      </SpringIn>
      </ParallaxFloat>

      <SpringIn delay={0.2}>
        <div className="mx-auto mt-10 max-w-xl overflow-hidden rounded-card border border-neutro-border">
          <div className="grid grid-cols-4 gap-2 border-b border-neutro-border px-6 py-4">
            <p className="text-[11px] font-bold text-neutro-muted">PERÍODO</p>
            <p className="text-[11px] font-bold text-neutro-muted">TOTAL</p>
            <p className="text-[11px] font-bold text-neutro-muted">POR MÊS</p>
            <p className="text-[11px] font-bold text-neutro-muted">ECONOMIA</p>
          </div>
          {TABELA.map((linha, indice) => {
            const ativa = linha.periodo === periodo;
            return (
              <div
                key={linha.periodo}
                className={`grid grid-cols-4 gap-2 px-6 py-4 transition-colors duration-200 ${
                  ativa ? "bg-coral-light" : "bg-transparent"
                } ${indice < TABELA.length - 1 ? "border-b border-neutro-border" : ""}`}
              >
                <p className={`text-sm ${ativa ? "font-bold text-coral" : "text-escuro"}`}>
                  {PLANOS[linha.periodo].label}
                </p>
                <p className={`text-sm ${ativa ? "font-bold text-coral" : "text-escuro"}`}>
                  {linha.total}
                </p>
                <p className={`text-sm ${ativa ? "font-bold text-coral" : "text-escuro"}`}>
                  {linha.porMes}
                </p>
                <p
                  className={`text-sm font-bold ${
                    linha.economiaCor === "coral"
                      ? "text-coral"
                      : linha.economiaCor === "verde"
                        ? "text-verde"
                        : ativa
                          ? "text-coral"
                          : "text-escuro"
                  }`}
                >
                  {linha.economia ?? "-"}
                </p>
              </div>
            );
          })}
        </div>
      </SpringIn>
    </section>
  );
}
