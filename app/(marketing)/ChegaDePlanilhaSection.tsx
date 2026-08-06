import Link from "next/link";
import { AlertTriangle, XCircle, FileX, ChevronDown, Check } from "lucide-react";
import { SpringIn } from "@/components/marketing/SpringIn";
import { MARK_PATH } from "@/components/Logo";

const PROBLEMAS = [
  { icone: AlertTriangle, texto: "Planilha que trava", bg: "bg-ambar-light", cor: "text-ambar-dark" },
  { icone: XCircle, texto: "Fórmula que quebra", bg: "bg-erro-light", cor: "text-erro-dark" },
  { icone: FileX, texto: "Dado que some", bg: "bg-erro-light", cor: "text-erro-dark" },
] as const;

export function ChegaDePlanilhaSection() {
  return (
    <section className="bg-superficie px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-14 lg:flex-row lg:gap-20">
        <SpringIn className="flex flex-1 flex-col items-center gap-3">
          <div className="w-full max-w-[280px] rounded-2xl border border-neutro-border bg-fundo/80 p-5 shadow-xl shadow-escuro/10 backdrop-blur-xl">
            <p className="mb-2 text-[10px] font-bold text-neutro-muted">
              planilha_salao_final_v3.xlsx
            </p>
            <div className="mb-1.5 grid grid-cols-[1.4fr_1fr_1fr] gap-0.5">
              <div className="h-3.5 rounded-sm bg-neutro-disabled" />
              <div className="h-3.5 rounded-sm bg-erro-light" />
              <div className="h-3.5 rounded-sm bg-neutro-disabled" />
            </div>
            <div className="mb-1.5 grid grid-cols-[1.4fr_1fr_1fr] gap-0.5 text-[8px] text-neutro-muted-strong">
              <p className="rounded-sm bg-neutro-disabled px-1 py-0.5">Maria</p>
              <p className="rounded-sm bg-neutro-disabled px-1 py-0.5">R$120</p>
              <p className="rounded-sm bg-erro-light px-1 py-0.5 text-erro-dark">#REF!</p>
            </div>
            <div className="mb-2.5 grid grid-cols-[1.4fr_1fr_1fr] gap-0.5 text-[8px] text-neutro-muted-strong">
              <p className="rounded-sm bg-neutro-disabled px-1 py-0.5">Carol</p>
              <p className="rounded-sm bg-ambar-soft px-1 py-0.5">???</p>
              <p className="rounded-sm bg-neutro-disabled px-1 py-0.5">17/03</p>
            </div>
            <p className="text-[11px] font-bold text-erro-dark">#REF! fórmula quebrada</p>
          </div>

          <ChevronDown className="h-6 w-6 text-neutro-border" strokeWidth={2.5} />

          <div className="w-full max-w-[250px] rounded-2xl border border-neutro-border bg-fundo p-4 shadow-lg shadow-escuro/10">
            <p className="mb-2 text-[10px] font-bold text-neutro-muted">Entradas hoje</p>
            <p className="mb-3 text-xl font-extrabold text-escuro">R$ 580</p>
            <div className="mb-1.5 flex justify-between">
              <p className="text-[11px] text-escuro">Maria — Escova</p>
              <p className="flex items-center gap-1 text-[11px] font-semibold text-verde">
                R$ 120 <Check className="h-3 w-3" strokeWidth={3} />
              </p>
            </div>
            <div className="mb-2.5 flex justify-between">
              <p className="text-[11px] text-escuro">Carol — Manicure</p>
              <p className="flex items-center gap-1 text-[11px] font-semibold text-verde">
                R$ 90 <Check className="h-3 w-3" strokeWidth={3} />
              </p>
            </div>
            <div className="flex justify-between border-t border-neutro-border pt-2.5">
              <p className="text-[11px] text-neutro-muted">Saldo do caixa</p>
              <p className="text-sm font-extrabold text-verde">R$ 470,00</p>
            </div>
          </div>
        </SpringIn>

        <SpringIn delay={0.1} className="flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-coral">
            Chega de planilha
          </p>
          <h2 className="mt-4 font-display text-[1.75rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
            Fecha essa planilha.
          </h2>
          <p className="mt-3 max-w-md text-[15px] leading-relaxed text-neutro-muted sm:text-base">
            Você não deveria precisar de fórmula pra saber quanto faturou hoje.
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            {PROBLEMAS.map((problema) => (
              <div
                key={problema.texto}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 ${problema.bg}`}
              >
                <problema.icone className={`h-[18px] w-[18px] ${problema.cor}`} strokeWidth={2} />
                <p className="text-sm font-semibold text-escuro">{problema.texto}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center gap-3.5 rounded-2xl bg-fundo px-4 py-4">
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
        </SpringIn>
      </div>
    </section>
  );
}
