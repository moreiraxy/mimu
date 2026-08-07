"use client";

import Link from "next/link";
import { ChevronDown, Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { MARK_PATH } from "@/components/Logo";
import { ParallaxFloat } from "@/components/marketing/ParallaxFloat";

/** Uma célula da planilha, revelada com um pequeno pop de escala. As delays
 * de cada célula (ver chamadas abaixo) não seguem a ordem visual da grade
 * de propósito — imita o jeito "bagunçado" como uma planilha quebrada
 * recalcula suas células fora de ordem. */
function Celula({
  delay,
  className,
  children,
  as = "div",
}: {
  delay: number;
  className?: string;
  children?: React.ReactNode;
  as?: "div" | "p";
}) {
  const Componente = as === "p" ? motion.p : motion.div;
  return (
    <Componente
      initial={{ opacity: 0, scale: 0.7 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay, ease: [0.34, 1.56, 0.64, 1] }}
      className={className}
    >
      {children}
    </Componente>
  );
}

export function ChegaDePlanilhaSection() {
  const reduzida = useReducedMotion();

  return (
    <section className="overflow-x-hidden bg-superficie px-4 py-[48px] sm:px-6 lg:py-[80px]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-14 lg:flex-row lg:gap-20">
        <motion.div
          initial={{ opacity: 0, x: reduzida ? 0 : -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={
            reduzida
              ? { duration: 0.25, ease: "easeOut" }
              : { type: "spring", bounce: 0, duration: 0.7 }
          }
          className="flex flex-1 flex-col items-center gap-3"
        >
          <ParallaxFloat strength={130} className="w-full max-w-[280px]">
            <motion.div
              initial={{ x: 0, rotate: 0 }}
              whileInView={{ x: reduzida ? 0 : [0, -3, 3, 0], rotate: reduzida ? 0 : [0, -0.6, 0.6, 0] }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeInOut" }}
            >
              <div
                className="animate-float w-full rounded-2xl border border-neutro-border bg-fundo/80 p-5 shadow-xl shadow-escuro/10 backdrop-blur-xl"
                style={{ animationDuration: "6s", animationDelay: "0.9s" }}
              >
                <p className="mb-2 text-[10px] font-bold text-neutro-muted">
                  planilha_salao_final_v3.xlsx
                </p>
                <div className="mb-1.5 grid grid-cols-[1.4fr_1fr_1fr] gap-0.5">
                  <Celula delay={0.15} className="h-3.5 rounded-sm bg-neutro-disabled" />
                  <Celula delay={0.4} className="h-3.5 rounded-sm bg-erro-light" />
                  <Celula delay={0.25} className="h-3.5 rounded-sm bg-neutro-disabled" />
                </div>
                <div className="mb-1.5 grid grid-cols-[1.4fr_1fr_1fr] gap-0.5 text-[8px] text-neutro-muted-strong">
                  <Celula as="p" delay={0.5} className="rounded-sm bg-neutro-disabled px-1 py-0.5">
                    Maria
                  </Celula>
                  <Celula as="p" delay={0.1} className="rounded-sm bg-neutro-disabled px-1 py-0.5">
                    R$120
                  </Celula>
                  <Celula
                    as="p"
                    delay={0.6}
                    className="animate-blink-erro rounded-sm bg-erro-light px-1 py-0.5 text-erro-dark"
                  >
                    #REF!
                  </Celula>
                </div>
                <div className="mb-2.5 grid grid-cols-[1.4fr_1fr_1fr] gap-0.5 text-[8px] text-neutro-muted-strong">
                  <Celula as="p" delay={0.3} className="rounded-sm bg-neutro-disabled px-1 py-0.5">
                    Carol
                  </Celula>
                  <Celula as="p" delay={0.7} className="rounded-sm bg-ambar-soft px-1 py-0.5">
                    ???
                  </Celula>
                  <Celula as="p" delay={0.2} className="rounded-sm bg-neutro-disabled px-1 py-0.5">
                    17/03
                  </Celula>
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.2, delay: 0.8 }}
                  className="animate-blink-erro text-[11px] font-bold text-erro-dark"
                >
                  #REF! fórmula quebrada
                </motion.p>
              </div>
            </motion.div>
          </ParallaxFloat>

          <ChevronDown className="h-6 w-6 text-neutro-border" strokeWidth={2.5} />

          <ParallaxFloat strength={170} className="w-full max-w-[280px]">
            <motion.div
              initial={{ opacity: 0, scale: reduzida ? 1 : 0.9, y: reduzida ? 0 : 14 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={
                reduzida
                  ? { duration: 0.25, delay: 0.3 }
                  : { type: "spring", bounce: 0.15, duration: 0.7, delay: 0.5 }
              }
              className="rounded-2xl border border-neutro-border bg-fundo p-4 shadow-lg shadow-escuro/10"
            >
              <p className="mb-2 text-[10px] font-bold text-neutro-muted">Entradas hoje</p>
              <p className="mb-3 text-xl font-extrabold text-escuro">R$ 580</p>
              <div className="mb-1.5 flex justify-between">
                <p className="text-[11px] text-escuro">Maria · Escova</p>
                <p className="flex items-center gap-1 text-[11px] font-semibold text-verde">
                  R$ 120 <Check className="h-3 w-3" strokeWidth={3} />
                </p>
              </div>
              <div className="mb-2.5 flex justify-between">
                <p className="text-[11px] text-escuro">Carol · Manicure</p>
                <p className="flex items-center gap-1 text-[11px] font-semibold text-verde">
                  R$ 90 <Check className="h-3 w-3" strokeWidth={3} />
                </p>
              </div>
              <div className="flex justify-between border-t border-neutro-border pt-2.5">
                <p className="text-[11px] text-neutro-muted">Saldo do caixa</p>
                <p className="text-sm font-extrabold text-verde">R$ 470,00</p>
              </div>
            </motion.div>
          </ParallaxFloat>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: reduzida ? 0 : 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={
            reduzida
              ? { duration: 0.25, ease: "easeOut", delay: 0.1 }
              : { type: "spring", bounce: 0, duration: 0.7, delay: 0.1 }
          }
          className="flex-1"
        >
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-coral">
            Chega de planilha
          </p>
          <h2 className="mt-4 font-display text-[1.75rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
            Fecha essa planilha.
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-neutro-muted sm:text-base">
            Você não deveria precisar de fórmula pra saber quanto faturou hoje.
          </p>

          <div className="mt-7 flex items-center gap-3.5 rounded-2xl bg-fundo px-4 py-4">
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-coral">
              <svg width="17" height="13" viewBox="0 0 48 36" fill="none">
                <path d={MARK_PATH} stroke="white" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="text-[15px] font-bold text-escuro">
              Com a Mimu, você fala. Ela anota.
            </p>
          </div>

          <Link
            href="/cadastro"
            className="mt-6 inline-flex rounded-full bg-coral px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-coral/25 transition-transform duration-150 hover:bg-coral-hover active:scale-[0.97]"
          >
            Começar grátis
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
