"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { paraISOLocal } from "@/lib/utils";
import { SeletorSegmentado } from "@/components/SeletorSegmentado";
import { DiaView } from "./DiaView";
import { SemanaView } from "./SemanaView";
import { MesView } from "./MesView";

export default function AgendaPage() {
  const [visualizacao, setVisualizacao] = useState<"dia" | "semana" | "mes">(
    "dia",
  );
  const [dataSelecionada, setDataSelecionada] = useState(() =>
    paraISOLocal(new Date()),
  );

  return (
    <div className="flex flex-col gap-4 lg:mx-auto lg:max-w-5xl">
      <PageHeader title="Agenda" voltar={false} />

      <SeletorSegmentado
        opcoes={[
          { id: "dia", label: "Dia" },
          { id: "semana", label: "Semana" },
          { id: "mes", label: "Mês" },
        ]}
        valor={visualizacao}
        onChange={setVisualizacao}
      />

      {visualizacao === "dia" && (
        <DiaView data={dataSelecionada} onMudarData={setDataSelecionada} />
      )}

      {visualizacao === "semana" && (
        <SemanaView
          dataReferencia={dataSelecionada}
          onSelecionarDia={(iso) => {
            setDataSelecionada(iso);
            setVisualizacao("dia");
          }}
        />
      )}

      {/* Tocar num dia do mês leva ao DIA daquele dia: a visão do mês mostra
          onde tem movimento, e a pergunta seguinte é sempre "o que tem ali". */}
      {visualizacao === "mes" && (
        <MesView
          dataReferencia={dataSelecionada}
          onMudarMes={setDataSelecionada}
          onSelecionarDia={(iso) => {
            setDataSelecionada(iso);
            setVisualizacao("dia");
          }}
        />
      )}
    </div>
  );
}
