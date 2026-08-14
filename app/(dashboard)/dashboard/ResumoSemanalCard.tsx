"use client";

import { formatCurrency } from "@/lib/formatters";
import type { DiaResumo } from "@/lib/calculations";

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

export function ResumoSemanalCard({
  resumo,
  semanaAtual,
  semanaPassada,
}: {
  resumo: DiaResumo[];
  semanaAtual: number;
  semanaPassada: number;
}) {
  const totalMovimentado = resumo.reduce(
    (soma, dia) => soma + dia.realizado + dia.previsto,
    0,
  );
  const maiorValor = Math.max(
    ...resumo.map((d) => d.realizado + d.previsto),
    1,
  );

  return (
    <div className="rounded-card border border-neutro-border bg-superficie p-4">
      <p className="text-sm font-semibold text-escuro">Resumo semanal</p>

      {totalMovimentado === 0 ? (
        <p className="mt-3 text-sm text-neutro-muted">
          Sem vendas registradas essa semana ainda.
        </p>
      ) : (
        <>
          <div className="mt-4 flex h-24 items-end justify-between gap-2">
            {resumo.map((dia) => {
              const data = new Date(`${dia.data}T00:00:00`);
              const alturaRealizado = (dia.realizado / maiorValor) * 100;
              const alturaPrevisto = (dia.previsto / maiorValor) * 100;

              return (
                <div
                  key={dia.data}
                  className="flex flex-1 flex-col items-center gap-1.5"
                >
                  <div className="flex h-20 w-full flex-col-reverse justify-start">
                    <div
                      className="w-full bg-verde"
                      style={{ height: `${alturaRealizado}%` }}
                    />
                    {dia.previsto > 0 && (
                      <div
                        className="w-full bg-primary-light"
                        style={{ height: `${alturaPrevisto}%` }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-neutro-muted">
                    {DIAS_SEMANA[data.getDay()]}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-neutro-border pt-3">
            <div>
              <p className="text-[11px] text-neutro-muted">Esta semana</p>
              <p className="text-sm font-semibold text-escuro">
                {formatCurrency(semanaAtual)}
              </p>
            </div>
            {semanaPassada > 0 && (
              <VariacaoSemanal atual={semanaAtual} passada={semanaPassada} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

function VariacaoSemanal({
  atual,
  passada,
}: {
  atual: number;
  passada: number;
}) {
  const variacao = Math.round(((atual - passada) / passada) * 100);
  const positiva = variacao >= 0;

  return (
    <p
      className={`text-xs font-semibold ${positiva ? "text-verde-dark" : "text-erro"}`}
    >
      {positiva ? "+" : ""}
      {variacao}% vs semana passada
    </p>
  );
}
