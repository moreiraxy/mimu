"use client";

import Link from "next/link";
import { AlertTriangle, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import type { StatusNegocio } from "@/lib/calculations";

const STATUS_CONFIG: Record<
  StatusNegocio,
  { icone: typeof TrendingUp; label: string; bg: string }
> = {
  otimo: { icone: TrendingUp, label: "Ótimo dia!", bg: "bg-verde" },
  atencao: { icone: AlertTriangle, label: "Atenção", bg: "bg-ambar" },
  prejuizo: { icone: TrendingDown, label: "Dia difícil", bg: "bg-[#EF4444]" },
  recorde: { icone: Trophy, label: "Recorde!", bg: "bg-coral" },
};

const FRASES: Record<
  StatusNegocio,
  Record<"manha" | "tarde" | "noite", string>
> = {
  otimo: {
    manha: "Já começou bem o dia. Continue assim!",
    tarde: "Tarde produtiva! Sigamos com esse ritmo.",
    noite: "Ótimo fechamento de dia. Parabéns!",
  },
  atencao: {
    manha: "O dia começou devagar. Ainda dá tempo de acelerar.",
    tarde: "Ainda dá tempo de virar o dia. Bora?",
    noite: "O dia foi mais devagar hoje. Amanhã tem revanche.",
  },
  prejuizo: {
    manha: "Dia difícil pela frente. Vamos com calma.",
    tarde: "Segue com calma — nem todo dia é igual.",
    noite: "Foi um dia difícil. Amanhã é um novo recomeço.",
  },
  recorde: {
    manha: "Já começou batendo recorde! Incrível.",
    tarde: "Recorde batido! Você está arrasando hoje.",
    noite: "Que dia! Novo recorde no bolso.",
  },
};

function periodoDoDia(hora: number): "manha" | "tarde" | "noite" {
  if (hora >= 5 && hora < 12) return "manha";
  if (hora >= 12 && hora < 18) return "tarde";
  return "noite";
}

const CONFETE_PONTOS = [
  { top: "12%", left: "78%", size: 6, atraso: "0s" },
  { top: "22%", left: "18%", size: 5, atraso: "0.3s" },
  { top: "68%", left: "88%", size: 5, atraso: "0.6s" },
  { top: "80%", left: "14%", size: 6, atraso: "0.15s" },
  { top: "40%", left: "94%", size: 4, atraso: "0.45s" },
];

function Confete() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px] motion-reduce:hidden"
    >
      {CONFETE_PONTOS.map((p, i) => (
        <span
          key={i}
          className="absolute animate-confete rounded-full bg-white/70"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.atraso,
          }}
        />
      ))}
    </div>
  );
}

export function StatusCard({
  status,
  realizado,
  previsto,
  meta,
  progresso,
}: {
  status: StatusNegocio;
  realizado: number;
  previsto: number;
  meta: number;
  progresso: number;
}) {
  const config = STATUS_CONFIG[status];
  const frase = FRASES[status][periodoDoDia(new Date().getHours())];
  const larguraBarra = Math.min(100, Math.max(0, progresso));

  return (
    <Link
      href="/faturamento"
      className={cn(
        "relative block overflow-hidden rounded-[20px] p-5 text-white",
        config.bg,
      )}
    >
      {status === "recorde" && <Confete />}

      <p className="flex items-center gap-1.5 text-xs text-white/75">
        <config.icone className="h-3.5 w-3.5" strokeWidth={2.25} />
        {config.label}
      </p>
      <p className="mt-1 text-sm text-white">{frase}</p>

      <div className="mt-4 flex justify-between">
        <div>
          <p className="text-[11px] text-white/70">Realizado</p>
          <p className="text-lg font-semibold">{formatCurrency(realizado)}</p>
        </div>
        <div>
          <p className="text-[11px] text-white/70">Previsto</p>
          <p className="text-lg font-semibold">{formatCurrency(previsto)}</p>
        </div>
        <div>
          <p className="text-[11px] text-white/70">Meta</p>
          <p className="text-lg font-semibold">{formatCurrency(meta)}</p>
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full rounded-full bg-white/30">
        <div
          className="h-full rounded-full bg-superficie transition-[width]"
          style={{ width: `${larguraBarra}%` }}
        />
      </div>
    </Link>
  );
}
