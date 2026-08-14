"use client";

import { CalendarCheck, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { MelhorDia } from "@/lib/calculations";

function MiniCard({
  icone: Icone,
  titulo,
  children,
}: {
  icone: typeof Wallet;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-neutro-border bg-superficie p-3.5">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-neutro-muted">
        <Icone className="h-3.5 w-3.5" strokeWidth={2.25} />
        {titulo}
      </p>
      {children}
    </div>
  );
}

export function SecundariosCards({
  metaDiaria,
  melhorDia,
  realizadoMesAnterior,
  variacaoPercentual,
}: {
  metaDiaria: number;
  melhorDia: MelhorDia | null;
  realizadoMesAnterior: number;
  variacaoPercentual: number | null;
}) {
  const subiu = (variacaoPercentual ?? 0) >= 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
      <MiniCard icone={Wallet} titulo="Meta diária">
        <p className="text-lg font-semibold text-escuro">
          {metaDiaria > 0 ? formatCurrency(metaDiaria) : "—"}
        </p>
      </MiniCard>

      <MiniCard icone={CalendarCheck} titulo="Melhor dia do mês">
        {melhorDia ? (
          <>
            <p className="text-lg font-semibold text-escuro">
              {formatCurrency(melhorDia.valor)}
            </p>
            <p className="text-xs text-neutro-muted">{formatDate(melhorDia.data)}</p>
          </>
        ) : (
          <p className="text-lg font-semibold text-escuro">—</p>
        )}
      </MiniCard>

      <MiniCard
        icone={subiu ? TrendingUp : TrendingDown}
        titulo="Vs. mês anterior"
      >
        {variacaoPercentual !== null ? (
          <>
            <p
              className={cn(
                "text-lg font-semibold",
                subiu ? "text-verde-texto" : "text-erro-texto",
              )}
            >
              {subiu ? "+" : ""}
              {variacaoPercentual}%
            </p>
            <p className="text-xs text-neutro-muted">
              antes: {formatCurrency(realizadoMesAnterior)}
            </p>
          </>
        ) : (
          <p className="text-lg font-semibold text-escuro">—</p>
        )}
      </MiniCard>
    </div>
  );
}
