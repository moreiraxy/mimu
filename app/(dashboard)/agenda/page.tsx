"use client";

import { useState } from "react";
import { cn, paraISOLocal } from "@/lib/utils";
import { DiaView } from "./DiaView";
import { SemanaView } from "./SemanaView";

export default function AgendaPage() {
  const [visualizacao, setVisualizacao] = useState<"dia" | "semana">("dia");
  const [dataSelecionada, setDataSelecionada] = useState(() =>
    paraISOLocal(new Date()),
  );

  return (
    <div className="flex flex-col gap-4 lg:mx-auto lg:max-w-5xl">
      <div className="flex justify-center">
        <div className="flex gap-1 rounded-full bg-fundo p-0.5">
          {(["dia", "semana"] as const).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => setVisualizacao(opcao)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold",
                visualizacao === opcao
                  ? "bg-superficie text-primary-forte shadow-sm"
                  : "text-neutro-muted",
              )}
            >
              {opcao === "dia" ? "Dia" : "Semana"}
            </button>
          ))}
        </div>
      </div>

      {visualizacao === "dia" ? (
        <DiaView data={dataSelecionada} onMudarData={setDataSelecionada} />
      ) : (
        <SemanaView
          dataReferencia={dataSelecionada}
          onSelecionarDia={(iso) => {
            setDataSelecionada(iso);
            setVisualizacao("dia");
          }}
        />
      )}
    </div>
  );
}
