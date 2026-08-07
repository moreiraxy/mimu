"use client";

import Link from "next/link";
import { Check, AlertCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { MARK_PATH } from "@/components/Logo";
import { ParallaxFloat } from "@/components/marketing/ParallaxFloat";
import { PhoneTilt } from "@/components/marketing/PhoneTilt";
import { VALOR_MENSAL_MIMU } from "@/lib/planos";

const AVATARES = [
  { iniciais: "AN", cor: "bg-coral" },
  { iniciais: "RO", cor: "bg-verde" },
  { iniciais: "CA", cor: "bg-ambar" },
] as const;

const METRICAS = [
  { valor: "7 dias", legenda: "grátis para começar" },
  { valor: `R$ ${VALOR_MENSAL_MIMU}`, legenda: "por mês depois" },
  { valor: "2 min", legenda: "para configurar tudo" },
] as const;

function NotifCard({
  className,
  strength,
  delay,
  floatSeconds,
  floatDelay,
  children,
}: {
  className: string;
  strength: number;
  delay: number;
  floatSeconds: number;
  floatDelay: number;
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
        style={
          reduzida
            ? undefined
            : { animationDuration: `${floatSeconds}s`, animationDelay: `${floatDelay}s` }
        }
        className="animate-float-slow flex items-start gap-2 rounded-[14px] border border-white/70 bg-white/75 px-3.5 py-3 shadow-xl shadow-escuro/10 backdrop-blur-xl lg:gap-3 lg:rounded-[19px] lg:px-[19px] lg:py-4"
      >
        {children}
      </motion.div>
    </ParallaxFloat>
  );
}

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center overflow-hidden bg-[radial-gradient(90%_60%_at_50%_0%,rgb(255_107_91_/_0.14)_0%,rgb(255_107_91_/_0)_60%)] px-5 pb-16 pt-32 text-center sm:px-6 sm:pb-24 sm:pt-40 lg:pt-48">
      <ParallaxFloat strength={40} className="mb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
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
      </ParallaxFloat>

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
          Começar grátis por 7 dias
        </Link>
        <p className="text-xs text-neutro-muted">
          Sem cartão de crédito. Cancele quando quiser.
        </p>

        <div className="mt-6 flex items-center gap-6 sm:gap-10">
          {METRICAS.map((metrica) => (
            <div key={metrica.legenda} className="text-center">
              <p className="font-display text-lg font-bold text-escuro sm:text-xl">
                {metrica.valor}
              </p>
              <p className="mt-0.5 text-[11px] text-neutro-muted sm:text-xs">
                {metrica.legenda}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* MOCKUP DO CELULAR — iPhone 15 Pro (titânio, Dynamic Island). Entra
          depois do texto (delay maior que o CTA acima) de propósito: o
          celular é só CSS/divs, sem imagem pra carregar, mas sem essa
          entrada ele aparecia junto/antes do texto por não ter fade-in
          nenhum, invertendo a ordem de leitura no primeiro paint. */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="relative mx-auto mt-16 w-[340px] max-w-full sm:mt-20"
      >
        <div className="animate-float">
          <PhoneTilt strength={60} className="relative mx-auto h-[706px] w-[340px] max-w-full">
            {/* corpo titânio */}
            <div
              className="absolute inset-0 rounded-[52px]"
              style={{
                background:
                  "linear-gradient(155deg, #4a4a4a 0%, #232323 18%, #1a1a1a 50%, #2c2c2c 82%, #4a4a4a 100%)",
                boxShadow: "0 50px 90px rgba(30,30,46,0.28), 0 0 0 1px rgba(255,255,255,0.08) inset",
              }}
            />
            {/* botões laterais */}
            <div className="absolute -left-[3px] top-36 h-8 w-[3px] rounded-l-sm bg-[#232323]" />
            <div className="absolute -left-[3px] top-[196px] h-16 w-[3px] rounded-l-sm bg-[#232323]" />
            <div className="absolute -right-[3px] top-[184px] h-[86px] w-[3px] rounded-r-sm bg-[#232323]" />

            {/* tela */}
            <div className="absolute inset-0 box-border rounded-[52px] p-3">
              <div
                className="relative h-full w-full overflow-hidden rounded-[42px] bg-fundo"
                style={{ boxShadow: "0 0 0 0.5px rgba(0,0,0,0.4) inset" }}
              >
                {/* Dynamic Island */}
                <div className="absolute left-1/2 top-[18px] z-10 flex h-[34px] w-[116px] -translate-x-1/2 items-center justify-end rounded-[24px] bg-[#0a0a0a] pr-2.5">
                  <div
                    className="h-[9px] w-[9px] rounded-full bg-[#1a1a2e]"
                    style={{ boxShadow: "0 0 0 1.5px rgba(255,255,255,0.05) inset" }}
                  />
                </div>

                {/* status bar */}
                <div className="absolute inset-x-0 top-0 z-[9] flex h-[54px] items-center justify-between px-[30px]">
                  <p className="text-[15px] font-bold text-escuro">9:41</p>
                  <div className="flex items-center gap-[5px]">
                    <svg width="17" height="13" viewBox="0 0 16 12" fill="none">
                      <path d="M1 4.5 Q8 -1 15 4.5" stroke="#1E1E2E" strokeWidth={1.4} fill="none" strokeLinecap="round" />
                      <path d="M4 7 Q8 3.5 12 7" stroke="#1E1E2E" strokeWidth={1.4} fill="none" strokeLinecap="round" />
                      <circle cx="8" cy="9.5" r="1.1" fill="#1E1E2E" />
                    </svg>
                    <div className="box-border h-3 w-[25px] rounded-[3px] border border-escuro p-[1.5px]">
                      <div className="h-full w-3/4 rounded-[1px] bg-escuro" />
                    </div>
                  </div>
                </div>

                {/* conteúdo do dashboard */}
                <div className="absolute inset-x-0 bottom-0 top-[62px] flex flex-col gap-[13px] px-[18px] py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-neutro-muted">Bom dia,</p>
                      <p className="mt-px text-[15px] font-extrabold text-escuro">Andréia</p>
                    </div>
                    <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[10px] bg-coral">
                      <svg width="16" height="12" viewBox="0 0 48 36" fill="none">
                        <path d={MARK_PATH} stroke="white" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-coral p-[15px]">
                    <p className="mb-1 text-[11px] text-white/80">Ótimo dia!</p>
                    <p className="mb-3 text-[13px] text-white">82% da meta de hoje.</p>
                    <div className="mb-2.5 flex justify-between">
                      <div>
                        <p className="text-[9px] text-white/70">Realizado</p>
                        <p className="text-base font-extrabold text-white">R$ 410</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-white/70">Meta</p>
                        <p className="text-base font-extrabold text-white">R$ 500</p>
                      </div>
                    </div>
                    <div className="h-[5px] w-full rounded-md bg-white/25">
                      <div className="h-full w-[82%] rounded-md bg-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-neutro-border bg-superficie p-[11px]">
                      <p className="mb-1 text-[10px] text-neutro-muted">A receber</p>
                      <p className="text-sm font-extrabold text-verde">R$ 240</p>
                    </div>
                    <div className="rounded-xl border border-neutro-border bg-superficie p-[11px]">
                      <p className="mb-1 text-[10px] text-neutro-muted">A pagar</p>
                      <p className="text-sm font-extrabold text-ambar">R$ 180</p>
                    </div>
                  </div>

                  <div className="flex-1 rounded-xl border border-neutro-border bg-superficie p-3">
                    <p className="mb-2 text-[11px] font-bold text-escuro">Agenda de hoje</p>
                    <div className="mb-1.5 flex justify-between">
                      <p className="text-[10px] text-escuro">Maria · Escova</p>
                      <p className="text-[10px] text-neutro-muted">14h</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-[10px] text-escuro">Carol · Manicure</p>
                      <p className="text-[10px] text-neutro-muted">16h</p>
                    </div>
                  </div>
                </div>

                {/* brilho */}
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(115deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 18%, transparent 34%)",
                  }}
                />
              </div>
            </div>

            {/* reflexo na borda superior */}
            <div className="absolute left-[14%] right-[14%] top-[2px] h-px rounded-sm bg-white/35" />
          </PhoneTilt>
        </div>

        {/* Cards flutuantes — visíveis também no mobile, em 75% do tamanho e mais próximos do celular; no desktop (lg:) assumem a posição/tamanho originais */}
        <NotifCard
          className="absolute left-[-18px] top-[64px] z-10 max-w-[180px] lg:left-[-248px] lg:top-[110px] lg:max-w-[240px]"
          strength={130}
          delay={0.4}
          floatSeconds={5.5}
          floatDelay={1.3}
        >
          <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-verde lg:h-[29px] lg:w-[29px]">
            <Check className="h-3 w-3 text-white lg:h-4 lg:w-4" strokeWidth={3} />
          </span>
          <p className="text-xs leading-snug text-escuro lg:text-sm">
            Parabéns! Você bateu seu recorde de <strong>R$ 580</strong>
          </p>
        </NotifCard>

        <NotifCard
          className="absolute right-[-14px] top-[260px] z-10 max-w-[188px] lg:right-[-260px] lg:top-[390px] lg:max-w-[250px]"
          strength={95}
          delay={0.55}
          floatSeconds={6.5}
          floatDelay={2.1}
        >
          <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-coral text-[9px] font-extrabold text-white lg:h-[29px] lg:w-[29px] lg:text-[11px]">
            CA
          </span>
          <p className="text-xs leading-snug text-escuro lg:text-sm">
            Carol agendou amanhã às 14h · R$ 120 previsto
          </p>
        </NotifCard>

        <NotifCard
          className="absolute bottom-[130px] left-[-14px] z-10 max-w-[173px] lg:bottom-[100px] lg:left-[-220px] lg:max-w-[230px]"
          strength={145}
          delay={0.7}
          floatSeconds={5.8}
          floatDelay={2.9}
        >
          <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-ambar lg:h-[29px] lg:w-[29px]">
            <AlertCircle className="h-[11px] w-[11px] text-white lg:h-[15px] lg:w-[15px]" strokeWidth={2.5} />
          </span>
          <p className="text-xs leading-snug text-escuro lg:text-sm">Maria ainda te deve R$ 80</p>
        </NotifCard>

        <NotifCard
          className="absolute bottom-0 right-[-12px] z-10 max-w-[154px] py-3 lg:right-[-210px] lg:max-w-[205px] lg:py-[15px]"
          strength={85}
          delay={0.85}
          floatSeconds={5}
          floatDelay={3.4}
        >
          <div className="w-full">
            <p className="mb-1.5 text-[11px] text-neutro-muted lg:text-[13px]">Meta do dia</p>
            <div className="mb-1.5 h-[6px] w-full rounded-md bg-neutro-border lg:h-[7px]">
              <div className="h-full w-[82%] rounded-md bg-coral" />
            </div>
            <p className="text-xs font-bold text-escuro lg:text-sm">82% concluída</p>
          </div>
        </NotifCard>
      </motion.div>
    </section>
  );
}
