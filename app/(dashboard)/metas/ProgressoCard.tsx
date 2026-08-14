"use client";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import type { StatusNegocio } from "@/lib/calculations";

const COR_BARRA: Record<StatusNegocio, string> = {
  otimo: "bg-verde",
  atencao: "bg-ambar",
  prejuizo: "bg-[#EF4444]",
  recorde: "bg-primary",
};

export function ProgressoCard({
  realizado,
  meta,
  progresso,
  status,
  projecaoFechamento,
}: {
  realizado: number;
  meta: number;
  progresso: number;
  status: StatusNegocio;
  projecaoFechamento: number;
}) {
  const larguraBarra = Math.min(100, Math.max(0, progresso));
  const vaiBaterMeta = meta > 0 && projecaoFechamento >= meta;

  return (
    <div className="rounded-[20px] border border-neutro-border bg-superficie p-5">
      <p className="text-xs font-semibold text-neutro-muted">Realizado este mês</p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-3xl font-semibold text-escuro">
          {formatCurrency(realizado)}
        </p>
        {meta > 0 && (
          <p className="text-sm text-neutro-muted">
            de {formatCurrency(meta)}
          </p>
        )}
      </div>

      {meta > 0 ? (
        <>
          <div className="mt-4 h-3 w-full rounded-full bg-fundo">
            <div
              className={cn(
                "h-full rounded-full transition-[width]",
                COR_BARRA[status],
              )}
              style={{ width: `${larguraBarra}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs font-semibold text-neutro-muted-strong">
            {progresso}% da meta
          </p>

          <div
            className={cn(
              "mt-4 rounded-button p-3.5",
              vaiBaterMeta ? "bg-verde-light" : "bg-ambar-soft",
            )}
          >
            <p
              className={cn(
                "text-sm font-semibold",
                vaiBaterMeta ? "text-verde-dark" : "text-ambar-dark",
              )}
            >
              No ritmo atual você vai fechar em {formatCurrency(projecaoFechamento)}
            </p>
            <p className="mt-0.5 text-xs text-neutro-muted">
              {vaiBaterMeta
                ? "Nesse ritmo a meta é batida."
                : "Nesse ritmo a meta fica em risco. Vale acelerar."}
            </p>
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-neutro-muted">
          Defina uma meta mensal para acompanhar o progresso.
        </p>
      )}
    </div>
  );
}
