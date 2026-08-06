import Link from "next/link";
import { BookOpen, Table2, Brain, ChevronDown } from "lucide-react";
import { SpringIn } from "@/components/marketing/SpringIn";
import { MARK_PATH } from "@/components/Logo";

const SUBSTITUTOS = [
  {
    icone: BookOpen,
    titulo: "Caderno",
    texto: "Anotações perdidas, letra ilegível, nada organizado.",
  },
  {
    icone: Table2,
    titulo: "Planilha",
    texto: "Fórmula que quebra, dado que some, trava toda hora.",
  },
  {
    icone: Brain,
    titulo: "Memória",
    texto: "Esqueceu de cobrar, esqueceu de agendar, esqueceu.",
  },
] as const;

export function CadernoPlanilhaMemoriaSection() {
  return (
    <section className="bg-superficie px-5 py-16 sm:px-6 sm:py-24">
      <SpringIn>
        <h2 className="mx-auto max-w-xl text-center font-display text-[1.6rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
          Caderno, planilha ou memória — a Mimu substitui os três.
        </h2>
      </SpringIn>

      <div className="mx-auto mt-10 flex max-w-4xl flex-col gap-3 sm:mt-12 sm:flex-row">
        {SUBSTITUTOS.map((item, indice) => (
          <SpringIn key={item.titulo} delay={indice * 0.1} className="flex-1">
            <div className="flex h-full flex-col rounded-card border border-neutro-border bg-fundo p-6">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-coral-light text-coral">
                <item.icone className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <p className="text-[15px] font-bold text-escuro">{item.titulo}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-neutro-muted">
                {item.texto}
              </p>
            </div>
          </SpringIn>
        ))}
      </div>

      <div className="mt-6 flex justify-center sm:mt-8">
        <ChevronDown className="h-6 w-6 text-neutro-border" strokeWidth={2.5} />
      </div>

      <SpringIn delay={0.15}>
        <div className="mx-auto mt-2 max-w-lg rounded-[26px] bg-coral-light px-8 py-11 text-center">
          <span className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-coral">
            <svg width="24" height="18" viewBox="0 0 48 36" fill="none">
              <path d={MARK_PATH} stroke="white" strokeWidth={5.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="font-display text-xl font-bold text-escuro sm:text-2xl">
            A Mimu cuida de tudo isso por você.
          </p>
          <Link
            href="/cadastro"
            className="mt-7 inline-flex items-center justify-center rounded-full bg-coral px-8 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-coral/30 transition-transform duration-150 hover:bg-coral-hover active:scale-[0.97]"
          >
            Começar agora — 14 dias grátis
          </Link>
        </div>
      </SpringIn>
    </section>
  );
}
