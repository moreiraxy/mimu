"use client";

import { useMemo, useState } from "react";
import { GraficoDuasSeries } from "@/components/graficos/GraficoDuasSeries";
import { SeletorSegmentado } from "@/components/SeletorSegmentado";
import { paraISOLocal } from "@/lib/utils";
import type { Transacao } from "@/types";

/**
 * A movimentação do caixa: o que entrou contra o que saiu.
 *
 * O desenho mora em components/graficos/GraficoDuasSeries — a mesma peça
 * serve à visão semanal do faturamento (realizado contra previsto). Aqui fica
 * só o que é do financeiro: somar as transações por dia e oferecer a janela.
 */

const JANELAS = [
  { id: "7", label: "7 dias" },
  { id: "30", label: "30 dias" },
] as const;

type Janela = (typeof JANELAS)[number]["id"];

function ultimosDias(transacoes: Transacao[], dias: number) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const entradas: number[] = [];
  const saidas: number[] = [];

  for (let i = dias - 1; i >= 0; i--) {
    const dia = new Date(hoje);
    dia.setDate(dia.getDate() - i);
    const iso = paraISOLocal(dia);

    let entrada = 0;
    let saida = 0;
    for (const t of transacoes) {
      if (t.data !== iso) continue;
      if (t.tipo === "entrada") entrada += Number(t.valor);
      else saida += Number(t.valor);
    }
    entradas.push(entrada);
    saidas.push(saida);
  }

  return { entradas, saidas };
}

export function GraficoMovimentacao({
  transacoes,
}: {
  transacoes: Transacao[];
}) {
  const [janela, setJanela] = useState<Janela>("7");
  const { entradas, saidas } = useMemo(
    () => ultimosDias(transacoes, Number(janela)),
    [transacoes, janela],
  );

  return (
    <GraficoDuasSeries
      titulo="Movimentação"
      principal={{ nome: "Entradas", valores: entradas }}
      apoio={{ nome: "Saídas", valores: saidas }}
      altura={96}
      rodape={
        <SeletorSegmentado
          opcoes={JANELAS.map((j) => ({ id: j.id, label: j.label }))}
          valor={janela}
          onChange={setJanela}
          fundo="sutil"
          className="mt-4"
        />
      }
    />
  );
}
