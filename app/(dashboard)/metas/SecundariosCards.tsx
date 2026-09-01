"use client";

import { CalendarCheck, TrendingDown, TrendingUp, Wallet } from "lucide-react";
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
    <div className="vidro-card flex flex-col gap-2 rounded-[20px] p-4">
      <p className="flex items-center gap-1.5 text-[13px] leading-tight text-neutro-muted">
        <Icone
          className="h-3.5 w-3.5 flex-shrink-0 text-primary-forte"
          strokeWidth={2.5}
        />
        <span className="truncate">{titulo}</span>
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
        <p className="text-[24px] font-bold leading-tight tracking-tight text-escuro">
          {metaDiaria > 0 ? formatCurrency(metaDiaria) : "—"}
        </p>
      </MiniCard>

      <MiniCard icone={CalendarCheck} titulo="Melhor dia do mês">
        {melhorDia ? (
          <>
            <p className="text-[24px] font-bold leading-tight tracking-tight text-escuro">
              {formatCurrency(melhorDia.valor)}
            </p>
            <p className="text-[13px] text-neutro-muted">
              {formatDate(melhorDia.data)}
            </p>
          </>
        ) : (
          <p className="text-[24px] font-bold leading-tight tracking-tight text-escuro">
            —
          </p>
        )}
      </MiniCard>

      <MiniCard
        icone={subiu ? TrendingUp : TrendingDown}
        titulo="Vs. mês anterior"
      >
        {variacaoPercentual !== null ? (
          <>
            {/* Sem verde/vermelho: o sinal já diz a direção, e o ícone do
                título muda junto. Duas cores de alarme para dizer "caiu 4%"
                era o mesmo excesso do resto da tela. */}
            <p className="text-[24px] font-bold leading-tight tracking-tight text-escuro">
              {subiu ? "+" : ""}
              {variacaoPercentual}%
            </p>
            <p className="text-[13px] text-neutro-muted">
              antes: {formatCurrency(realizadoMesAnterior)}
            </p>
          </>
        ) : (
          <p className="text-[24px] font-bold leading-tight tracking-tight text-escuro">
            —
          </p>
        )}
      </MiniCard>
    </div>
  );
}
