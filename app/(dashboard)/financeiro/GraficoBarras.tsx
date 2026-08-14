"use client";

import { useMemo, useState } from "react";
import { cn, paraISOLocal } from "@/lib/utils";
import type { Transacao } from "@/types";

interface DiaMovimento {
  data: string;
  entrada: number;
  saida: number;
}

function ultimosDias(transacoes: Transacao[], dias: number): DiaMovimento[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const resultado: DiaMovimento[] = [];

  for (let i = dias - 1; i >= 0; i--) {
    const dia = new Date(hoje);
    dia.setDate(dia.getDate() - i);
    const proximoDia = new Date(dia);
    proximoDia.setDate(proximoDia.getDate() + 1);

    let entrada = 0;
    let saida = 0;
    for (const t of transacoes) {
      const data = new Date(`${t.data}T00:00:00`);
      if (data >= dia && data < proximoDia) {
        if (t.tipo === "entrada") entrada += Number(t.valor);
        else saida += Number(t.valor);
      }
    }

    resultado.push({ data: paraISOLocal(dia), entrada, saida });
  }

  return resultado;
}

export function GraficoBarras({ transacoes }: { transacoes: Transacao[] }) {
  const [janela, setJanela] = useState<7 | 30>(7);
  const dias = useMemo(
    () => ultimosDias(transacoes, janela),
    [transacoes, janela],
  );
  const maiorValor = Math.max(
    ...dias.map((d) => Math.max(d.entrada, d.saida)),
    1,
  );

  return (
    <div className="rounded-card border border-neutro-border bg-superficie p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-escuro">Movimentação</p>
        <div className="flex gap-1 rounded-full bg-fundo p-0.5">
          {([7, 30] as const).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => setJanela(opcao)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold",
                janela === opcao
                  ? "bg-superficie text-primary-forte shadow-sm"
                  : "text-neutro-muted",
              )}
            >
              {opcao}d
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex h-24 gap-1.5 overflow-x-auto">
        {dias.map((dia) => {
          const alturaEntrada = (dia.entrada / maiorValor) * 100;
          const alturaSaida = (dia.saida / maiorValor) * 100;
          return (
            <div
              key={dia.data}
              className="flex h-full min-w-[8px] flex-shrink-0 flex-1 items-end gap-0.5"
            >
              <div className="flex h-full flex-1 flex-col-reverse justify-start">
                <div
                  className="w-full bg-verde"
                  style={{ height: `${alturaEntrada}%` }}
                />
              </div>
              <div className="flex h-full flex-1 flex-col-reverse justify-start">
                <div
                  className="w-full bg-erro/40"
                  style={{ height: `${alturaSaida}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
