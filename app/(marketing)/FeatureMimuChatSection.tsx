"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ParallaxFloat } from "@/components/marketing/ParallaxFloat";
import { EntradaMockup } from "@/components/marketing/EntradaMockup";
import { TituloAnimado } from "@/components/marketing/TituloAnimado";
import { SpringIn } from "@/components/marketing/SpringIn";
import { ContagemNumero } from "@/components/marketing/ContagemNumero";

type PassoChat =
  | { tipo: "user"; texto: string; duracao: number }
  | { tipo: "digitando"; duracao: number }
  | { tipo: "mimu"; texto: string; contagem?: number; subtexto?: string; duracao: number };

/** Roteiro de 2 perguntas/respostas — cada passo tem sua própria `duracao`
 * (quanto tempo fica "sendo o mais recente" antes do próximo passo aparecer),
 * como no `delay += msg.duracao` do exemplo original. */
const ROTEIRO: PassoChat[] = [
  { tipo: "user", texto: "quanto vendi essa semana?", duracao: 700 },
  { tipo: "digitando", duracao: 1200 },
  {
    tipo: "mimu",
    texto: "R$ 1.840",
    contagem: 1840,
    subtexto: "+21% vs semana passada",
    duracao: 2200,
  },
  { tipo: "user", texto: "quem me deve agora?", duracao: 700 },
  { tipo: "digitando", duracao: 1000 },
  { tipo: "mimu", texto: "Carol deve R$ 80 e Ana deve R$ 120.", duracao: 1800 },
];
const PAUSA_FINAL = 2000;

/** Avança pelo roteiro em loop: só começa depois que o card termina de
 * entrar na tela (`pronto`), pausa quando o card sai do viewport, e reinicia
 * do zero depois que o roteiro inteiro termina + uma pausa. `passo` é quantos
 * itens do ROTEIRO já "ativaram" (0 = nada ainda). */
function useRoteiroChat(pronto: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const emVista = useInView(ref, { margin: "-100px" });
  const [passo, setPasso] = useState(0);
  const [ciclo, setCiclo] = useState(0);

  useEffect(() => {
    if (!emVista || !pronto) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let acumulado = 300;
    ROTEIRO.forEach((item, indice) => {
      timers.push(setTimeout(() => setPasso(indice + 1), acumulado));
      acumulado += item.duracao;
    });
    timers.push(setTimeout(() => setPasso(0), acumulado + PAUSA_FINAL));
    return () => timers.forEach(clearTimeout);
  }, [emVista, pronto, ciclo]);

  useEffect(() => {
    if (!emVista || !pronto) return;
    const duracaoTotal = 300 + ROTEIRO.reduce((soma, item) => soma + item.duracao, 0) + PAUSA_FINAL;
    const intervalo = setInterval(() => setCiclo((c) => c + 1), duracaoTotal);
    return () => clearInterval(intervalo);
  }, [emVista, pronto]);

  const digitando = passo > 0 && ROTEIRO[passo - 1]?.tipo === "digitando";
  const mensagens = ROTEIRO.slice(0, passo).filter(
    (item): item is Extract<PassoChat, { tipo: "user" | "mimu" }> => item.tipo !== "digitando",
  );

  return { ref, mensagens, digitando };
}

function BolhaMensagem({
  align,
  className,
  children,
}: {
  align: "start" | "end";
  className?: string;
  children: React.ReactNode;
}) {
  const reduzida = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: reduzida ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`max-w-[85%] flex-shrink-0 rounded-2xl px-3.5 py-2.5 ${align === "end" ? "self-end" : "self-start"} ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function FeatureMimuChatSection() {
  const [pronto, setPronto] = useState(false);
  const { ref, mensagens, digitando } = useRoteiroChat(pronto);
  const areaMensagensRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const area = areaMensagensRef.current;
    if (!area) return;
    area.scrollTop = area.scrollHeight;
  }, [mensagens.length, digitando]);

  return (
    <section className="bg-superficie px-4 py-[56px] sm:px-6 lg:py-[120px]">
      <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-14 lg:flex-row-reverse lg:gap-20">
        <ParallaxFloat strength={60} className="w-full max-w-[420px] flex-1">
          <EntradaMockup onEntrada={() => setTimeout(() => setPronto(true), 400)}>
            <div
              ref={ref}
              className="flex h-[420px] flex-col rounded-2xl bg-fundo p-6 shadow-[0_4px_24px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-center gap-2.5 border-b border-neutro-border pb-3">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">
                  M
                </span>
                <span className="text-[15px] font-bold text-escuro">Mimu</span>
                <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-verde">
                  <span className="h-1.5 w-1.5 rounded-full bg-verde" />
                  Online
                </span>
              </div>

              <div
                ref={areaMensagensRef}
                className="flex flex-1 flex-col gap-2.5 overflow-y-auto pt-4"
              >
                {mensagens.map((item, indice) =>
                  item.tipo === "user" ? (
                    <BolhaMensagem key={indice} align="end" className="bg-coral-light">
                      <p className="text-[13px] text-escuro">{item.texto}</p>
                    </BolhaMensagem>
                  ) : (
                    <BolhaMensagem
                      key={indice}
                      align="start"
                      className="border border-neutro-border bg-superficie"
                    >
                      {item.contagem ? (
                        <p className="text-xl font-extrabold text-escuro">
                          <ContagemNumero
                            valor={item.contagem}
                            formatar={(n) => `R$ ${Math.round(n).toLocaleString("pt-BR")}`}
                            ativo
                            duracao={900}
                          />
                        </p>
                      ) : (
                        <p className="text-[13px] text-escuro">{item.texto}</p>
                      )}
                      {item.subtexto && (
                        <motion.p
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: [0.85, 1.12, 1] }}
                          transition={{ duration: 0.4, delay: 0.7, ease: "easeOut" }}
                          className="mt-0.5 text-xs font-bold text-verde"
                        >
                          {item.subtexto}
                        </motion.p>
                      )}
                    </BolhaMensagem>
                  ),
                )}

                <motion.div
                  initial={false}
                  animate={{ opacity: digitando ? 1 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex w-fit flex-shrink-0 items-center gap-1 self-start rounded-2xl border border-neutro-border bg-superficie px-3.5 py-2.5"
                >
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-neutro-muted"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </motion.div>
              </div>

              <div className="mt-3 rounded-full border border-neutro-border bg-superficie px-3.5 py-2.5">
                <p className="text-[13px] text-neutro-muted">Fala com a Mimu...</p>
              </div>
            </div>
          </EntradaMockup>
        </ParallaxFloat>

        <SpringIn delay={0.1} className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-coral">
            Mimu, sua assistente
          </p>
          <TituloAnimado
            linhas="A Mimu registra enquanto você atende."
            className="mt-4 max-w-md font-display text-[clamp(2rem,4vw,3rem)] font-bold leading-[1.1] tracking-tight text-escuro"
          />
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
