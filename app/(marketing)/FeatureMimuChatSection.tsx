"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { SpringIn } from "@/components/marketing/SpringIn";
import { ParallaxFloat } from "@/components/marketing/ParallaxFloat";

function useEstagiosChat() {
  const ref = useRef<HTMLDivElement>(null);
  const emVista = useInView(ref, { once: true, margin: "-100px" });
  const [estagio, setEstagio] = useState(0);

  useEffect(() => {
    if (!emVista) return;
    const timers = [
      setTimeout(() => setEstagio(1), 300),
      setTimeout(() => setEstagio(2), 900),
      setTimeout(() => setEstagio(3), 1900),
    ];
    return () => timers.forEach(clearTimeout);
  }, [emVista]);

  return { ref, estagio };
}

function Bolha({
  visivel,
  align,
  children,
  className,
}: {
  visivel: boolean;
  align: "start" | "end";
  children: React.ReactNode;
  className?: string;
}) {
  const reduzida = useReducedMotion();
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visivel ? 1 : 0, y: visivel || reduzida ? 0 : 16 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${align === "end" ? "self-end" : "self-start"} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function FeatureMimuChatSection() {
  const { ref, estagio } = useEstagiosChat();

  return (
    <section className="bg-superficie px-4 py-[48px] sm:px-6 lg:py-[80px]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-14 lg:flex-row-reverse lg:gap-20">
        <ParallaxFloat strength={30} className="w-full max-w-[380px] flex-1">
          <SpringIn>
            <div
              ref={ref}
              className="flex h-[340px] flex-col rounded-2xl bg-fundo p-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-center gap-2.5 border-b border-neutro-border pb-3">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">
                  M
                </span>
                <span className="text-sm font-bold text-escuro">Mimu</span>
                <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-verde">
                  <span className="h-1.5 w-1.5 rounded-full bg-verde" />
                  Online
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2.5 pt-4">
                <Bolha visivel={estagio >= 1} align="end" className="bg-coral-light">
                  <p className="text-[13px] text-escuro">quanto vendi essa semana?</p>
                </Bolha>

                <motion.div
                  initial={false}
                  animate={{ opacity: estagio === 2 ? 1 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex w-fit items-center gap-1 self-start rounded-2xl border border-neutro-border bg-superficie px-3.5 py-2.5"
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-neutro-muted"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </motion.div>

                <Bolha visivel={estagio >= 3} align="start" className="border border-neutro-border bg-superficie">
                  <p className="text-xl font-extrabold text-escuro">R$ 1.840</p>
                  <p className="mt-0.5 text-xs font-bold text-verde">
                    +21% vs semana passada
                  </p>
                </Bolha>
              </div>

              <div className="mt-3 rounded-full border border-neutro-border bg-superficie px-3.5 py-2.5">
                <p className="text-[13px] text-neutro-muted">Fala com a Mimu...</p>
              </div>
            </div>
          </SpringIn>
        </ParallaxFloat>

        <SpringIn delay={0.1} className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-coral">
            Mimu, sua assistente
          </p>
          <h2 className="mt-4 max-w-md font-display text-[1.6rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
            A Mimu registra enquanto você atende.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutro-muted sm:text-base">
            Fala comigo como fala com uma amiga. Eu entendo, confirmo e
            organizo tudo, sem formulário e sem menu.
          </p>
          <Link
            href="/cadastro"
            className="mt-7 inline-flex items-center justify-center rounded-full border-[1.5px] border-coral px-7 py-3 text-sm font-bold text-coral transition-colors duration-200 hover:bg-coral hover:text-white active:scale-[0.97]"
          >
            Começar grátis
          </Link>
        </SpringIn>
      </div>
    </section>
  );
}
