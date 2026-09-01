"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useFaturamentoPorPeriodo } from "@/hooks/useFaturamentoPorPeriodo";
import { useTipoGrafico } from "@/hooks/useTipoGrafico";
import { GraficoArea } from "@/components/graficos/GraficoArea";
import { GraficoBarras } from "@/components/graficos/GraficoBarras";
import { Valor } from "@/components/Valor";

/**
 * `alto` é o tamanho "grande" do widget: o mesmo conteúdo com o gráfico maior.
 *
 * O gráfico é a única coisa que ganha com mais altura — o rótulo e o valor
 * ficam do mesmo tamanho, senão o cartão grande vira o pequeno ampliado, que é
 * como o olho lê "zoom" em vez de "mais informação".
 */
/**
 * A porta do faturamento na home: valor da semana, um traço do que aconteceu,
 * e a seta.
 *
 * O gráfico com seletor de período MORAVA AQUI, e era o cartão mais apertado
 * da tela: 31 colunas, quatro botões de período e um título, tudo em 340px de
 * largura. A referência resolve isso de outro jeito — a home mostra o resumo, e
 * o detalhe é uma tela inteira, com o valor em corpo grande e o gráfico
 * ocupando a largura toda. É para lá que esta seta leva.
 */
export function CartaoResumoFaturamento({ alto = false }: { alto?: boolean }) {
  const { resumo, loading } = useFaturamentoPorPeriodo("1s");
  const { tipo } = useTipoGrafico();

  if (loading && !resumo) {
    return (
      <div
        className="vidro-card rounded-[20px]"
        style={{ height: alto ? 260 : 168 }}
      />
    );
  }
  if (!resumo) return null;

  const valores = resumo.barras.map((b) => b.valor);

  return (
    <Link
      href="/faturamento/resumo"
      className="vidro-card block overflow-hidden rounded-[20px] pt-4"
    >
      <div className="flex items-start justify-between px-4">
        <div>
          <p className="text-[13px] text-neutro-muted">Faturamento na semana</p>
          <Valor
            valor={resumo.total}
            className="mt-0.5 block text-[26px] font-bold leading-tight text-escuro"
          />
        </div>
        <ChevronRight
          className="mt-1 h-[18px] w-[18px] flex-shrink-0 text-neutro-muted"
          strokeWidth={2}
        />
      </div>

      {/* O gráfico encosta nas bordas do cartão. É o que a referência faz, e é
          o que faz ele parecer parte do cartão em vez de uma figura colada
          dentro dele. */}
      <div className="mt-2">
        {tipo === "linha" ? (
          <GraficoArea valores={valores} altura={alto ? 150 : 72} />
        ) : (
          <div className="px-4 pb-4">
            <GraficoBarras valores={valores} altura={alto ? 150 : 72} />
          </div>
        )}
      </div>
    </Link>
  );
}
