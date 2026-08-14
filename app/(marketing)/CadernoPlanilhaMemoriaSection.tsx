import Link from "next/link";
import { BookOpen, Table2, Brain, ChevronDown, ArrowRight } from "lucide-react";
import { SpringIn } from "@/components/marketing/SpringIn";
import { ParallaxFloat } from "@/components/marketing/ParallaxFloat";
import { EntradaMockup } from "@/components/marketing/EntradaMockup";
import { MARK_PATH } from "@/components/Logo";

const SUBSTITUTOS = [
  {
    icone: BookOpen,
    titulo: "Caderno",
    texto: "Anotações perdidas, letra ilegível, nada organizado.",
    parallax: 70,
  },
  {
    icone: Table2,
    titulo: "Planilha",
    texto: "Fórmula que quebra, dado que some, trava toda hora.",
    parallax: 105,
  },
  {
    icone: Brain,
    titulo: "Memória",
    texto: "Esqueceu de cobrar, esqueceu de agendar, esqueceu.",
    parallax: 70,
  },
] as const;

export function CadernoPlanilhaMemoriaSection() {
  return (
    <section className="bg-fundo px-4 py-[48px] sm:px-6 lg:py-[80px]">
      <SpringIn>
        <h2 className="mx-auto max-w-xl text-center font-display text-[1.6rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
          Caderno, planilha ou memória, a Mimu substitui os três.
        </h2>
      </SpringIn>

      <div className="mx-auto mt-10 grid max-w-[1200px] grid-cols-1 items-stretch gap-3 sm:mt-12 sm:grid-cols-3">
        {SUBSTITUTOS.map((item, indice) => (
          <ParallaxFloat key={item.titulo} strength={item.parallax} className="h-full">
            <EntradaMockup delay={indice * 0.1}>
              <div className="flex h-full flex-col rounded-card border border-neutro-border bg-fundo p-6">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-primary-light text-primary-forte">
                  <item.icone className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <p className="text-[15px] font-bold text-escuro">{item.titulo}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-neutro-muted">
                  {item.texto}
                </p>
              </div>
            </EntradaMockup>
          </ParallaxFloat>
        ))}
      </div>

      <div className="mt-6 flex justify-center sm:mt-8">
        <ChevronDown className="h-6 w-6 text-neutro-border" strokeWidth={2.5} />
      </div>

      {/* CTA final — o mais impactante da página: título grande, botão grande
          com ícone e subtexto de urgência, pra fechar com força antes do footer. */}
      <ParallaxFloat strength={95} className="mx-auto mt-2 max-w-2xl">
        <EntradaMockup delay={0.15}>
          <div className="rounded-[26px] bg-primary-light px-8 py-12 text-center sm:py-16">
            <span className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
              <svg width="26" height="20" viewBox="0 0 48 36" fill="none">
                <path d={MARK_PATH} stroke="#0A0A0A" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="mx-auto max-w-xl font-display text-[clamp(2.5rem,5vw,4rem)] font-bold leading-[1.05] tracking-tight text-escuro">
              A Mimu cuida de tudo isso por você.
            </p>
            <p className="mt-4 text-sm font-semibold text-neutro-muted-strong">
              Só precisa de 2 minutos para começar.
            </p>
            <Link
              href="/cadastro"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-[48px] py-[20px] text-[18px] font-bold text-primary-text shadow-lg shadow-primary/30 transition-transform duration-150 hover:bg-primary-hover active:scale-[0.97]"
            >
              Começar agora, 7 dias grátis
              <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
            </Link>
          </div>
        </EntradaMockup>
      </ParallaxFloat>
    </section>
  );
}
