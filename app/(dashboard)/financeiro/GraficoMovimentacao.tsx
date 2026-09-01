"use client";

import { useMemo, useState } from "react";
import { BarChart3, TrendingUp } from "lucide-react";
import { GraficoArea } from "@/components/graficos/GraficoArea";
import { SeletorSegmentado } from "@/components/SeletorSegmentado";
import { useTipoGrafico } from "@/hooks/useTipoGrafico";
import { cn, paraISOLocal } from "@/lib/utils";
import type { Transacao } from "@/types";

/**
 * A movimentação do caixa — a mesma peça da tela de faturamento, agora com as
 * DUAS séries: o que entrou e o que saiu.
 *
 * A forma é escolha de quem usa, igual à tela de faturamento: a curva responde
 * "para onde isso está indo" e a coluna responde "quanto foi em cada dia". A
 * preferência é a mesma das outras telas (hooks/useTipoGrafico), então trocar
 * aqui troca lá — é uma decisão sobre como a pessoa lê gráfico, não sobre esta
 * tela.
 *
 * AS DUAS SÉRIES DIVIDEM A MESMA ESCALA. Cada uma normalizada pelo próprio
 * maior valor desenharia o pico de R$ 80 em saídas na mesma altura do pico de
 * R$ 4.000 em entradas, e o gráfico passaria a mentir sobre o que mais pesa.
 */

interface DiaMovimento {
  data: string;
  entrada: number;
  saida: number;
}

const JANELAS = [
  { id: "7", label: "7 dias" },
  { id: "30", label: "30 dias" },
] as const;

type Janela = (typeof JANELAS)[number]["id"];

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

export function GraficoMovimentacao({
  transacoes,
}: {
  transacoes: Transacao[];
}) {
  const { tipo, alternar } = useTipoGrafico();
  const [janela, setJanela] = useState<Janela>("7");
  const dias = useMemo(
    () => ultimosDias(transacoes, Number(janela)),
    [transacoes, janela],
  );

  const entradas = dias.map((d) => d.entrada);
  const saidas = dias.map((d) => d.saida);
  const maximo = Math.max(...entradas, ...saidas, 1);

  return (
    <div className="vidro-card rounded-[20px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] leading-tight text-neutro-muted">
            Movimentação
          </p>
          <div className="mt-2 flex items-center gap-3">
            <Legenda cor="bg-primary" texto="Entradas" />
            <Legenda cor="bg-white/35" texto="Saídas" />
          </div>
        </div>

        <button
          type="button"
          onClick={alternar}
          aria-label={tipo === "linha" ? "Ver em barras" : "Ver em linha"}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-escuro"
        >
          {tipo === "linha" ? (
            <BarChart3 className="h-[18px] w-[18px]" strokeWidth={2} />
          ) : (
            <TrendingUp className="h-[18px] w-[18px]" strokeWidth={2} />
          )}
        </button>
      </div>

      {tipo === "linha" ? (
        // As duas curvas ocupam a MESMA caixa, sobrepostas: é assim que se
        // compara duas séries no mesmo eixo. Uma embaixo da outra viraria dois
        // gráficos, e a comparação teria que ser feita de cabeça.
        <div className="relative mt-4 h-24">
          <div className="absolute inset-0">
            <GraficoArea
              valores={saidas}
              altura={96}
              maximo={maximo}
              cor="rgb(255 255 255 / 0.45)"
              pontoFinal={false}
            />
          </div>
          <div className="absolute inset-0">
            <GraficoArea valores={entradas} altura={96} maximo={maximo} />
          </div>
        </div>
      ) : (
        <ColunasPareadas dias={dias} maximo={maximo} />
      )}

      <SeletorSegmentado
        opcoes={JANELAS.map((j) => ({ id: j.id, label: j.label }))}
        valor={janela}
        onChange={setJanela}
        fundo="sutil"
        className="mt-4"
      />
    </div>
  );
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-neutro-muted">
      <span className={cn("h-2 w-2 rounded-full", cor)} />
      {texto}
    </span>
  );
}

function ColunasPareadas({
  dias,
  maximo,
}: {
  dias: DiaMovimento[];
  maximo: number;
}) {
  return (
    <div
      className={cn(
        "mt-4 flex h-24 items-end",
        // Trinta dias em duas colunas cada dá sessenta hastes: o respiro entre
        // os pares tem que encolher junto, senão cada haste fica com a largura
        // de um fio.
        dias.length > 12 ? "gap-[3px]" : "gap-2",
      )}
    >
      {dias.map((dia) => (
        // `min-w-0` impede que qualquer conteúdo defina a largura da coluna:
        // sem isso, colunas com e sem valor saem com espessuras diferentes, e a
        // espessura parece querer dizer algo sobre o número.
        <div
          key={dia.data}
          className="flex h-full min-w-0 flex-1 items-end gap-[2px]"
        >
          <Haste altura={(dia.entrada / maximo) * 100} classe="bg-primary" />
          <Haste altura={(dia.saida / maximo) * 100} classe="bg-white/35" />
        </div>
      ))}
    </div>
  );
}

function Haste({ altura, classe }: { altura: number; classe: string }) {
  return (
    <div className="flex h-full min-w-0 flex-1 items-end">
      <div
        className={cn(
          "w-full rounded-t-[3px] transition-[height] duration-300 ease-out motion-reduce:transition-none",
          classe,
        )}
        style={{ height: `${altura}%` }}
      />
    </div>
  );
}
