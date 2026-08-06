"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { SpringIn } from "@/components/marketing/SpringIn";

function useEstagiosChat() {
  const ref = useRef<HTMLDivElement>(null);
  const emVista = useInView(ref, { once: true, margin: "-100px" });
  const [estagio, setEstagio] = useState(0);

  useEffect(() => {
    if (!emVista) return;
    const timers = [
      setTimeout(() => setEstagio(1), 200),
      setTimeout(() => setEstagio(2), 600),
      setTimeout(() => setEstagio(3), 1500),
      setTimeout(() => setEstagio(4), 2100),
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
      animate={{ opacity: visivel ? 1 : 0, y: visivel || reduzida ? 0 : 10 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${align === "end" ? "self-end" : "self-start"} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function FeatureMimuChatSection() {
  const { ref, estagio } = useEstagiosChat();

  return (
    <section className="bg-superficie px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-14 lg:flex-row-reverse lg:gap-20">
        <SpringIn className="flex flex-1 justify-center">
          <div
            ref={ref}
            className="flex h-[520px] w-[260px] flex-col gap-2 rounded-[38px] border-[8px] border-escuro bg-fundo p-4 shadow-2xl shadow-escuro/25"
          >
            <div className="flex items-center gap-2 px-1">
              <div className="h-5 w-5 rounded-full bg-coral" />
              <p className="text-[13px] font-extrabold text-escuro">Mimu</p>
            </div>

            <div className="flex flex-1 flex-col gap-2 pt-1.5">
              <Bolha visivel={estagio >= 1} align="end" className="bg-coral-light">
                <p className="text-[11px] text-escuro">recebi 350 da Maria</p>
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
                    className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutro-muted"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </motion.div>

              <Bolha visivel={estagio >= 3} align="start" className="bg-coral">
                <div className="mb-1.5 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  <p className="text-[11px] font-bold text-white">Entrada registrada</p>
                </div>
                <p className="text-base font-extrabold text-white">R$ 350,00</p>
              </Bolha>

              <Bolha visivel={estagio >= 4} align="start" className="border border-neutro-border bg-superficie">
                <p className="text-[11px] leading-snug text-escuro">
                  Já atualizei o saldo da Maria. Quer registrar mais alguma?
                </p>
              </Bolha>
            </div>

            <div className="rounded-full border border-neutro-border bg-superficie px-3.5 py-2.5">
              <p className="text-[11px] text-neutro-muted">Fala com a Mimu...</p>
            </div>
          </div>
        </SpringIn>

        <SpringIn delay={0.1} className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-coral">
            Mimu, sua assistente
          </p>
          <h2 className="mt-4 max-w-md font-display text-[1.6rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
            A Mimu registra enquanto você atende.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-neutro-muted sm:text-base">
            Fala com ela como fala com uma amiga. A Mimu entende, confirma e
            organiza tudo — sem formulário e sem menu.
          </p>
        </SpringIn>
      </div>
    </section>
  );
}
