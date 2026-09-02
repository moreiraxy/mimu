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
    <div className="vidro-card rounded-[20px] p-4">
      <p className="mb-3 flex items-center gap-1.5 text-[15px] leading-tight text-neutro-muted">
        <History className="h-4 w-4 text-primary-forte" strokeWidth={2.25} />
        Últimos 6 meses
      </p>
      <div className="flex flex-col divide-y divide-escuro/[0.08]">
        {historico.map((linha) => {
          const bateu = linha.meta !== null && linha.realizado >= linha.meta;
          return (
            <div
              key={`${linha.ano}-${linha.mes}`}
              className="flex flex-col gap-1 py-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold text-escuro">
                  {NOMES_MES[linha.mes - 1]} {linha.ano}
                </span>
                {linha.meta !== null ? (
                  <span
                    /* O selo de "não bateu" era vermelho de erro. Um mês
                       abaixo da meta é um fato do negócio, não uma falha do
                       app — ele fica neutro, e só o mês batido acende. */
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      bateu
                        ? "bg-primary/20 text-primary-forte"
                        : "bg-escuro/[0.06] text-neutro-muted"
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
              <div className="flex items-center justify-between text-[13px] text-neutro-muted">
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
