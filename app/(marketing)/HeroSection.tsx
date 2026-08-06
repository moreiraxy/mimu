"use client";

import Link from "next/link";
import { Check, AlertCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { MARK_PATH } from "@/components/Logo";
import { ParallaxFloat } from "@/components/marketing/ParallaxFloat";

const AVATARES = [
  { iniciais: "AN", cor: "bg-coral" },
  { iniciais: "RO", cor: "bg-verde" },
  { iniciais: "CA", cor: "bg-ambar" },
] as const;

function NotifCard({
  className,
  strength,
  delay,
  children,
}: {
  className: string;
  strength: number;
  delay: number;
  children: React.ReactNode;
}) {
  const reduzida = useReducedMotion();
  return (
    <ParallaxFloat strength={strength} className={className}>
      <motion.div
        initial={{ opacity: 0, scale: reduzida ? 1 : 0.9, y: reduzida ? 0 : 14 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={
          reduzida
            ? { duration: 0.25, delay }
            : { type: "spring", bounce: 0.15, duration: 0.6, delay }
        }
        className="animate-float-slow flex max-w-[210px] items-start gap-2.5 rounded-2xl border border-white/70 bg-white/75 p-3.5 shadow-xl shadow-escuro/10 backdrop-blur-xl"
      >
        {children}
      </motion.div>
    </ParallaxFloat>
  );
}

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center overflow-hidden bg-[radial-gradient(90%_60%_at_50%_0%,rgb(255_107_91_/_0.14)_0%,rgb(255_107_91_/_0)_60%)] px-5 pb-16 pt-32 text-center sm:px-6 sm:pb-24 sm:pt-40 lg:pt-48">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6 flex items-center gap-3"
      >
        <div className="flex">
          {AVATARES.map((avatar, indice) => (
            <div
              key={avatar.iniciais}
              className={`-ml-2.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-fundo text-[10px] font-extrabold text-white first:ml-0 ${avatar.cor}`}
              style={{ zIndex: AVATARES.length - indice }}
            >
              {avatar.iniciais}
            </div>
          ))}
        </div>
        <p className="text-xs font-bold text-neutro-muted-strong sm:text-sm">
          +400 negócios de bairro já usam a Mimu
        </p>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="max-w-3xl font-display text-[2rem] font-bold leading-[1.15] tracking-tight text-escuro sm:text-5xl lg:text-6xl"
      >
        Enquanto você trabalha,
        <br />a Mimu cuida do seu negócio.
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mt-7 flex flex-col items-center gap-3 sm:mt-8"
      >
        <Link
          href="/cadastro"
          className="w-full max-w-xs rounded-full bg-coral px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-coral/30 transition-transform duration-150 hover:bg-coral-hover active:scale-[0.97] sm:w-auto sm:text-base"
        >
          Começar grátis por 14 dias
        </Link>
        <p className="text-xs text-neutro-muted">
          Sem cartão de crédito. Cancele quando quiser.
        </p>
      </motion.div>

      {/* MOCKUP DO CELULAR */}
      <div className="relative mt-16 w-[280px] sm:mt-20">
        <div className="animate-float rounded-[42px] border-[9px] border-escuro bg-fundo p-5 shadow-2xl shadow-escuro/25">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-neutro-muted">Bom dia,</p>
              <p className="text-[15px] font-extrabold text-escuro">Andréia</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-coral">
              <svg width="16" height="12" viewBox="0 0 48 36" fill="none">
                <path
                  d={MARK_PATH}
                  stroke="white"
                  strokeWidth={5.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="mt-3.5 rounded-2xl bg-coral p-4">
            <p className="text-[11px] text-white/80">Ótimo dia!</p>
            <p className="mt-0.5 text-[13px] text-white">82% da meta de hoje.</p>
            <div className="mt-3 flex justify-between">
              <div>
                <p className="text-[9px] text-white/70">Realizado</p>
                <p className="text-base font-extrabold text-white">R$ 410</p>
              </div>
              <div>
                <p className="text-[9px] text-white/70">Meta</p>
                <p className="text-base font-extrabold text-white">R$ 500</p>
              </div>
            </div>
            <div className="mt-2.5 h-[5px] w-full rounded-full bg-white/25">
              <div className="h-full w-[82%] rounded-full bg-white" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-neutro-border bg-superficie p-2.5">
              <p className="text-[10px] text-neutro-muted">A receber</p>
              <p className="text-sm font-extrabold text-verde">R$ 240</p>
            </div>
            <div className="rounded-xl border border-neutro-border bg-superficie p-2.5">
              <p className="text-[10px] text-neutro-muted">A pagar</p>
              <p className="text-sm font-extrabold text-ambar">R$ 180</p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-neutro-border bg-superficie p-3">
            <p className="text-[11px] font-bold text-escuro">Agenda de hoje</p>
            <div className="mt-2 flex justify-between">
              <p className="text-[10px] text-escuro">Maria — Escova</p>
              <p className="text-[10px] text-neutro-muted">14h</p>
            </div>
            <div className="mt-1.5 flex justify-between">
              <p className="text-[10px] text-escuro">Carol — Manicure</p>
              <p className="text-[10px] text-neutro-muted">16h</p>
            </div>
          </div>
        </div>

        {/* Cards flutuantes — só em telas grandes, pra não estourar a largura no mobile */}
        <NotifCard className="absolute left-[-190px] top-8 z-10 hidden lg:block" strength={30} delay={0.4}>
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-verde">
            <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
          </span>
          <p className="text-xs leading-snug text-escuro">
            Parabéns! Você bateu seu recorde — <strong>R$ 580</strong>
          </p>
        </NotifCard>

        <NotifCard className="absolute right-[-200px] top-64 z-10 hidden lg:block" strength={30} delay={0.55}>
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-coral text-[9px] font-extrabold text-white">
            CA
          </span>
          <p className="text-xs leading-snug text-escuro">
            Carol agendou amanhã às 14h — R$ 120 previsto
          </p>
        </NotifCard>

        <NotifCard className="absolute bottom-24 left-[-165px] z-10 hidden lg:block" strength={30} delay={0.7}>
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ambar">
            <AlertCircle className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
          </span>
          <p className="text-xs leading-snug text-escuro">Maria ainda te deve R$ 80</p>
        </NotifCard>

        <NotifCard className="absolute bottom-0 right-[-155px] z-10 hidden lg:block" strength={30} delay={0.85}>
          <div className="w-full">
            <p className="text-[11px] text-neutro-muted">Meta do dia</p>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-neutro-border">
              <div className="h-full w-[82%] rounded-full bg-coral" />
            </div>
            <p className="mt-1.5 text-xs font-bold text-escuro">82% concluída</p>
          </div>
        </NotifCard>
      </div>
    </section>
  );
}
