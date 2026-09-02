"use client";

import { BarChart3, TrendingUp } from "lucide-react";
import { GraficoArea } from "@/components/graficos/GraficoArea";
import { useTipoGrafico } from "@/hooks/useTipoGrafico";
import { cn } from "@/lib/utils";

/**
 * Duas séries no mesmo eixo, em linha ou em coluna, na escolha de quem usa.
 *
 * NASCEU DE UMA CÓPIA QUE IA ACONTECER. Isto existia dentro do gráfico de
 * movimentação do financeiro — entradas contra saídas —, e a visão semanal do
 * faturamento precisava exatamente da mesma peça com outros nomes: realizado
 * contra previsto. Duas cópias do mesmo desenho divergem no dia em que alguém
 * mexe numa só, e a que ficou para trás vira a tela que "não tem a opção de
 * linha".
 *
 * AS DUAS SÉRIES DIVIDEM A MESMA ESCALA, e isso não é detalhe: cada uma
 * normalizada pelo próprio maior valor desenharia o pico de R$ 80 na mesma
 * altura do pico de R$ 4.000, e o gráfico passaria a mentir sobre o que pesa.
 *
 * A escolha entre linha e coluna é a mesma do resto do app (useTipoGrafico):
 * trocar aqui troca lá, porque é uma decisão sobre como a pessoa lê gráfico, e
 * não sobre esta tela.
 */
export function GraficoDuasSeries({
  titulo,
  principal,
  apoio,
  rotulos,
  destaque,
  altura = 112,
  rodape,
}: {
  titulo: string;
  /** A série que a pessoa veio ver. Sai em néon. */
  principal: { nome: string; valores: number[] };
  /** A série de comparação. Sai em branco fosco, atrás. */
  apoio: { nome: string; valores: number[] };
  /** O que vai embaixo de cada coluna — "Seg", "Ter"... Opcional. */
  rotulos?: string[];
  /** Índice a destacar (hoje, por exemplo). */
  destaque?: number;
  altura?: number;
  /** Um seletor de período, quando a tela tiver um. */
  rodape?: React.ReactNode;
}) {
  const { tipo, alternar } = useTipoGrafico();

  const maximo = Math.max(...principal.valores, ...apoio.valores, 1);
  const colunas = Math.max(principal.valores.length, apoio.valores.length);

  return (
    <div className="vidro-card rounded-[20px] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] leading-tight text-neutro-muted">
            {titulo}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Legenda cor="bg-primary" texto={principal.nome} />
            <Legenda cor="bg-white/35" texto={apoio.nome} />
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
        <div className="relative mt-4" style={{ height: altura }}>
          <div className="absolute inset-0">
            <GraficoArea
              valores={apoio.valores}
              altura={altura}
              maximo={maximo}
              cor="rgb(255 255 255 / 0.45)"
              pontoFinal={false}
            />
          </div>
          <div className="absolute inset-0">
            <GraficoArea
              valores={principal.valores}
              altura={altura}
              maximo={maximo}
            />
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "mt-4 flex items-end",
            // Muitas colunas em pares dá o dobro de hastes: o respiro tem que
            // encolher junto, senão cada haste fica com a largura de um fio.
            colunas > 12 ? "gap-[3px]" : "gap-2",
          )}
          style={{ height: altura }}
        >
          {Array.from({ length: colunas }, (_, i) => (
            /*
              O par preenche a coluna inteira, e o rótulo do dia fica centrado
              sob o par — é a leitura padrão de gráfico de colunas agrupadas.

              Tentei recuar as hastes com `px-[12%]` para aproximá-las do meio,
              e as barras SUMIRAM: padding em porcentagem dentro de um item
              flex resolve contra a largura do CONTAINER, não da coluna. Doze
              por cento de toda a largura, dos dois lados de uma coluna de
              40px, zerou o espaço de conteúdo.
            */
            <div
              key={i}
              className="flex h-full min-w-0 flex-1 items-end gap-[2px]"
            >
              <Haste
                altura={((principal.valores[i] ?? 0) / maximo) * 100}
                classe="bg-primary"
              />
              <Haste
                altura={((apoio.valores[i] ?? 0) / maximo) * 100}
                classe="bg-white/35"
              />
            </div>
          ))}
        </div>
      )}

      {rotulos && (
        <div
          className={cn(
            "mt-2 flex",
            colunas > 12 ? "gap-[3px]" : "gap-2",
          )}
        >
          {rotulos.map((rotulo, i) => (
            <span
              key={i}
              className={cn(
                "min-w-0 flex-1 truncate text-center text-[11px] font-semibold",
                i === destaque ? "text-primary-forte" : "text-neutro-muted",
              )}
            >
              {rotulo}
            </span>
          ))}
        </div>
      )}

      {rodape}
    </div>
  );
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-neutro-muted">
      <span className={cn("h-2 w-2 flex-shrink-0 rounded-full", cor)} />
      {texto}
    </span>
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
