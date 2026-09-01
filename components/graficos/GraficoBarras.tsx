"use client";

import { cn } from "@/lib/utils";

/**
 * A mesma série do GraficoArea, em colunas.
 *
 * Existe porque a leitura é diferente, não porque uma seja melhor: a curva
 * responde "para onde isso está indo" e a barra responde "quanto foi em cada
 * dia". Quem fecha o caixa todo dia costuma querer a segunda; quem olha o mês
 * de longe, a primeira. Quem escolhe é a dona — ver hooks/useTipoGrafico.ts.
 */
export function GraficoBarras({
  valores,
  altura = 96,
}: {
  valores: number[];
  altura?: number;
}) {
  const maior = Math.max(...valores, 1);

  return (
    <div
      className={cn(
        "flex w-full items-end",
        // Um mês tem 31 colunas; uma semana tem 7. O mesmo respiro entre elas
        // deixaria as do mês com a largura de um fio.
        valores.length > 12 ? "gap-[2px]" : "gap-1.5",
      )}
      style={{ height: altura }}
    >
      {valores.map((valor, i) => (
        // `min-w-0` impede que qualquer conteúdo defina a largura da coluna:
        // sem isso, colunas com e sem rótulo saem com espessuras diferentes, e
        // a espessura parece querer dizer algo sobre o valor.
        <div key={i} className="flex h-full min-w-0 flex-1 items-end">
          <div
            className="w-full rounded-t-[3px] bg-primary-forte transition-[height] duration-300 ease-out motion-reduce:transition-none"
            style={{ height: `${(valor / maior) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}
