"use client";

import Link from "next/link";
import { AlertTriangle, TrendingDown, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import type { StatusNegocio } from "@/lib/calculations";

const STATUS_CONFIG: Record<
  StatusNegocio,
  { icone: typeof TrendingUp; label: string; bg: string; texto: string }
> = {
  /*
   * Fundo em tom suave e texto na cor, em vez de um bloco chapado saturado.
   *
   * O motivo é proporção. Numa tela quase preta com um só acento néon, um
   * vermelho igualmente saturado ocupando um cartão inteiro compete com a
   * marca em vez de acompanhá-la — foi o que deixou a interface "desornada".
   *
   * Os tons "-light" já trocam com o tema (claro: pastel; escuro: um fundo
   * profundo da mesma família), então o mesmo código serve aos dois. A cor
   * segue dizendo o que precisa dizer, só que na tipografia e no ícone, que
   * é onde a informação está.
   *
   * O estado "Recorde!" mantém o preenchimento cheio de propósito: ele é a
   * comemoração, e é o único momento em que gritar faz sentido.
   */
  otimo: {
    icone: TrendingUp,
    label: "Ótimo dia!",
    bg: "bg-verde-light",
    texto: "text-verde-texto",
  },
  atencao: {
    icone: AlertTriangle,
    label: "Atenção",
    bg: "bg-ambar-light",
    texto: "text-ambar-texto",
  },
  prejuizo: {
    icone: TrendingDown,
    label: "Dia difícil",
    bg: "bg-erro-light",
    texto: "text-erro-texto",
  },
  recorde: {
    icone: Trophy,
    label: "Recorde!",
    bg: "bg-primary",
    texto: "text-primary-text",
  },
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
    tarde: "Segue com calma. Nem todo dia é igual.",
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
        "relative block overflow-hidden rounded-[20px] p-5",
        config.bg,
        config.texto,
      )}
    >
      {status === "recorde" && <Confete />}

      {/* A cor semântica fica no selo de estado. Os números seguem neutros:
          é o que se lê primeiro, e tingir valor de dinheiro de vermelho ou
          verde faz o olho ler emoção antes de ler a quantia. */}
      <p className="flex items-center gap-1.5 text-xs font-bold">
        <config.icone className="h-3.5 w-3.5" strokeWidth={2.25} />
        {config.label}
      </p>
      <p className={cn("mt-1 text-sm", status === "recorde" ? "" : "text-escuro")}>
        {frase}
      </p>

      <div
        className={cn(
          "mt-4 flex justify-between",
          status === "recorde" ? "" : "text-escuro",
        )}
      >
        <div>
          <p className="text-[11px] opacity-60">Realizado</p>
          <p className="text-lg font-semibold">{formatCurrency(realizado)}</p>
        </div>
        <div>
          <p className="text-[11px] opacity-60">Previsto</p>
          <p className="text-lg font-semibold">{formatCurrency(previsto)}</p>
        </div>
        <div>
          <p className="text-[11px] opacity-60">Meta</p>
          <p className="text-lg font-semibold">{formatCurrency(meta)}</p>
        </div>
      </div>

      {/* A barra usa a própria cor do estado, não branco fixo: sobre os fundos
          suaves novos, o branco a 30% quase sumia. */}
      <div className="mt-3 h-1.5 w-full rounded-full bg-current/15">
        <div
          className="h-full rounded-full bg-current transition-[width]"
          style={{ width: `${larguraBarra}%` }}
        />
      </div>
    </Link>
  );
}
