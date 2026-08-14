"use client";

import { Check, History, X } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import type { LinhaHistoricoMeta } from "@/hooks/useMetas";

const NOMES_MES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function HistoricoCard({
  historico,
}: {
  historico: LinhaHistoricoMeta[];
}) {
  return (
    <div className="rounded-[20px] border border-neutro-border bg-superficie p-5">
      <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-escuro">
        <History className="h-4 w-4 text-neutro-muted-strong" strokeWidth={2.25} />
        Últimos 6 meses
      </p>
      <div className="flex flex-col divide-y divide-neutro-border">
        {historico.map((linha) => {
          const bateu = linha.meta !== null && linha.realizado >= linha.meta;
          return (
            <div
              key={`${linha.ano}-${linha.mes}`}
              className="flex flex-col gap-1 py-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-escuro">
                  {NOMES_MES[linha.mes - 1]} {linha.ano}
                </span>
                {linha.meta !== null ? (
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      bateu
                        ? "bg-verde-light text-verde-texto"
                        : "bg-erro-light text-erro-texto"
                    }`}
                  >
                    {bateu ? (
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                    ) : (
                      <X className="h-3 w-3" strokeWidth={2.5} />
                    )}
                    {bateu ? "Bateu" : "Não bateu"}
                  </span>
                ) : (
                  <span className="text-[11px] text-neutro-muted">Sem meta</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-neutro-muted">
                <span>
                  Meta: {linha.meta !== null ? formatCurrency(linha.meta) : "—"}
                </span>
                <span>Realizado: {formatCurrency(linha.realizado)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
