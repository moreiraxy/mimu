"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  Eye,
  EyeOff,
  Lock,
  TrendingUp,
} from "lucide-react";
import {
  PERIODOS,
  useFaturamentoPorPeriodo,
  type Periodo,
} from "@/hooks/useFaturamentoPorPeriodo";
import { useTipoGrafico } from "@/hooks/useTipoGrafico";
import { useValores } from "@/hooks/useValores";
import { GraficoArea } from "@/components/graficos/GraficoArea";
import { GraficoBarras } from "@/components/graficos/GraficoBarras";
import { Valor } from "@/components/Valor";
import { cn } from "@/lib/utils";

/**
 * O faturamento como TELA, no formato da referência.
 *
 * Era um cartão no meio da home, com 340px de largura para caber título, valor,
 * gráfico de 31 colunas e quatro botões de período. A referência resolve o
 * mesmo problema de outro jeito, e é o jeito certo: a home mostra o resumo, e
 * quem quer olhar de perto abre uma tela onde o valor é o maior texto da
 * página e o gráfico usa a largura inteira.
 *
 * Os três controles do alto — voltar, esconder valores e trocar a forma do
 * gráfico — são botões de vidro redondos flutuando sobre o conteúdo, como na
 * referência.
 */
export default function ResumoFaturamentoPage() {
  const router = useRouter();
  const [periodo, setPeriodo] = useState<Periodo>("1m");
  const { resumo, loading, bloqueado } = useFaturamentoPorPeriodo(periodo);
  const { tipo, alternar: alternarGrafico } = useTipoGrafico();
  const { escondidos, alternar: alternarValores } = useValores();

  const valores = resumo?.barras.map((b) => b.valor) ?? [];
  const variacao =
    resumo && resumo.totalAnterior > 0
      ? Math.round(
          ((resumo.total - resumo.totalAnterior) / resumo.totalAnterior) * 100,
        )
      : null;

  return (
    <div className="lg:mx-auto lg:max-w-3xl">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Voltar"
          className="vidro flex h-10 w-10 items-center justify-center rounded-full text-escuro"
        >
          <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={alternarGrafico}
            aria-label={
              tipo === "linha" ? "Ver em barras" : "Ver em linha"
            }
            className="vidro flex h-10 w-10 items-center justify-center rounded-full text-escuro"
          >
            {tipo === "linha" ? (
              <BarChart3 className="h-[18px] w-[18px]" strokeWidth={2} />
            ) : (
              <TrendingUp className="h-[18px] w-[18px]" strokeWidth={2} />
            )}
          </button>
          <button
            type="button"
            onClick={alternarValores}
            aria-label={escondidos ? "Mostrar valores" : "Esconder valores"}
            className="vidro flex h-10 w-10 items-center justify-center rounded-full text-escuro"
          >
            {escondidos ? (
              <EyeOff className="h-[18px] w-[18px]" strokeWidth={2} />
            ) : (
              <Eye className="h-[18px] w-[18px]" strokeWidth={2} />
            )}
          </button>
        </div>
      </header>

      <h1 className="mt-8 text-[15px] text-neutro-muted">
        {resumo?.titulo ?? "Faturamento"}
      </h1>
      {/* O valor em corpo grande é a assinatura desta tela na referência: ele
          é o assunto, e tudo abaixo explica de onde ele veio. */}
      <Valor
        valor={resumo?.total ?? 0}
        className="mt-1 block text-[40px] font-bold leading-none tracking-tight text-escuro"
      />
      {variacao !== null && (
        <p
          className={cn(
            "mt-2 text-[13px] font-semibold",
            variacao >= 0 ? "text-verde-texto" : "text-erro-texto",
          )}
        >
          {variacao >= 0 ? "+" : ""}
          {variacao}% vs período anterior
        </p>
      )}

      {bloqueado ? (
        <div className="vidro-card mt-8 flex flex-col items-start gap-3 rounded-[20px] p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary-forte">
            <Lock className="h-[18px] w-[18px]" strokeWidth={2.25} />
          </span>
          <p className="text-sm leading-relaxed text-neutro-muted">
            Comparar meses faz parte do plano pago. No grátis você vê a semana e
            o mês em que está.
          </p>
          <Link
            href="/minha-empresa/assinatura"
            className="text-sm font-bold text-primary-forte"
          >
            Ver planos →
          </Link>
        </div>
      ) : (
        <>
          {/*
            O gráfico e o EIXO moram no mesmo container, com o mesmo respiro.

            Estavam separados: o gráfico sangrava com `-mx-4` e os rótulos
            ficavam no respiro normal da página. O resultado é que "OUT" não
            caía embaixo do primeiro ponto — o eixo apontava para o lugar
            errado, o tempo todo, em silêncio.

            `px-3` em vez de sangrar até a borda: o ponto do fim da curva é
            redondo e tem raio, e encostado na borda ele saía pela metade.
          */}
          <div className="-mx-4 mt-8 px-3">
            {tipo === "linha" ? (
              <GraficoArea valores={valores} altura={180} />
            ) : (
              <GraficoBarras valores={valores} altura={180} />
            )}

          <div className="mt-2 flex justify-between">
            {(resumo?.barras ?? []).map((barra, i, todas) => (
              <span
                key={i}
                className="whitespace-nowrap text-[11px] text-neutro-muted"
              >
                {/* Com muitos pontos, mostrar todo rótulo vira uma parede de
                    números. Um a cada quatro mantém o eixo legível. */}
                {todas.length > 12 && i % 4 !== 0 ? "" : barra.rotulo}
              </span>
            ))}
          </div>
          </div>
        </>
      )}

      <div className="mt-7 flex rounded-full bg-neutro-disabled p-1">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriodo(p.id)}
            aria-pressed={periodo === p.id}
            className={cn(
              "flex-1 rounded-full py-2.5 text-sm font-bold transition-colors duration-200 motion-reduce:transition-none",
              periodo === p.id ? "bg-escuro text-fundo" : "text-neutro-muted",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {!bloqueado && (resumo?.principais.length ?? 0) > 0 && (
        <section className="mt-8">
          <h2 className="text-[15px] font-semibold text-escuro">
            Principais categorias
          </h2>
          {/* Fileira que rola, como os "Principais estabelecimentos" da
              referência: cada uma é um cartão pequeno, e não uma linha de
              tabela. */}
          <div className="scroll-fade-x -mr-4 mt-3 flex gap-3 overflow-x-auto pb-2 pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {resumo!.principais.map((p) => (
              <div
                key={p.nome}
                className="vidro-card flex w-[132px] flex-shrink-0 flex-col rounded-[18px] p-3.5"
              >
                <p className="truncate text-[11px] uppercase tracking-wide text-neutro-muted">
                  {p.nome}
                </p>
                <Valor
                  valor={p.valor}
                  className="mt-2 block text-[15px] font-bold text-escuro"
                />
                <p className="mt-0.5 text-[11px] text-neutro-muted">
                  {p.vezes} {p.vezes === 1 ? "vez" : "vezes"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {loading && !resumo && !bloqueado && (
        <div className="mt-8 h-[180px] animate-shimmer rounded-[20px] bg-neutro-disabled" />
      )}
    </div>
  );
}
