"use client";

import { useId } from "react";

/**
 * O gráfico da referência: uma linha suave com a área embaixo em degradê e um
 * ponto no fim.
 *
 * POR QUE NÃO BARRAS. Barras respondem "quanto em cada dia" e forçam o olho a
 * comparar alturas uma a uma. A curva responde "para onde isso está indo", que
 * é a pergunta de quem abre o app de manhã — e é a forma que a referência usa
 * em todas as telas de dinheiro. A diferença não é decorativa: com 31 dias, 31
 * barras viram um pente ilegível, e a mesma série como linha continua legível.
 *
 * É SVG à mão, sem biblioteca de gráfico. Uma série de números virando um
 * caminho não justifica 40kB no bundle de quem abre o app numa rede de bairro,
 * e nenhuma das opções prontas desenharia exatamente isto sem configuração
 * maior que o próprio componente.
 */
export function GraficoArea({
  valores,
  altura = 96,
  cor = "rgb(var(--primary-forte))",
  maximo,
  pontoFinal = true,
}: {
  valores: number[];
  altura?: number;
  cor?: string;
  /**
   * O topo da escala, quando ele vem de fora.
   *
   * Duas curvas sobrepostas (entradas e saídas) PRECISAM disso: cada uma
   * normalizada pelo próprio maior valor desenharia dois picos na mesma altura
   * com números completamente diferentes, e o gráfico passaria a mentir.
   */
  maximo?: number;
  /** O ponto do fim atrapalha na série de apoio de um gráfico sobreposto. */
  pontoFinal?: boolean;
}) {
  // O id precisa ser único por instância: dois gráficos na mesma tela com o
  // mesmo id de degradê fazem o segundo herdar o preenchimento do primeiro.
  const id = useId().replace(/:/g, "");

  if (valores.length === 0) return null;

  /*
   * O desenho usa uma caixa de 100x100 e `preserveAspectRatio="none"`.
   *
   * Assim o mesmo caminho serve a qualquer largura de tela sem recalcular
   * nada em JavaScript, e sem precisar medir o elemento antes de desenhar —
   * medir obrigaria a esperar um quadro, e o gráfico apareceria depois do
   * resto do cartão.
   */
  const maior = Math.max(maximo ?? 0, ...valores, 1);
  const passo = valores.length > 1 ? 100 / (valores.length - 1) : 0;
  const pontos = valores.map((v, i) => ({
    x: i * passo,
    // O eixo Y do SVG cresce para baixo; 92 em vez de 100 deixa uma folga no
    // topo para o ponto do fim não ser cortado pela borda.
    y: 92 - (v / maior) * 84,
  }));

  /*
   * A curva é feita com bézier cúbica entre cada par de pontos, usando as
   * médias horizontais como alças.
   *
   * É o "suavizado" da referência. Ligar os pontos com retas daria o zigue-zague
   * anguloso que a gente já tinha nas barras, só que mais fino.
   */
  const caminho = pontos.reduce((d, ponto, i, todos) => {
    if (i === 0) return `M ${ponto.x} ${ponto.y}`;
    const anterior = todos[i - 1]!;
    const meio = (anterior.x + ponto.x) / 2;
    return `${d} C ${meio} ${anterior.y}, ${meio} ${ponto.y}, ${ponto.x} ${ponto.y}`;
  }, "");

  const ultimo = pontos[pontos.length - 1]!;

  return (
    <div className="relative w-full" style={{ height: altura }}>
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ height: altura, width: "100%", display: "block" }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={`preenchimento-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.35" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* A área vem antes da linha para a linha ficar por cima dela. */}
      <path
        d={`${caminho} L 100 100 L 0 100 Z`}
        fill={`url(#preenchimento-${id})`}
      />
      <path
        d={caminho}
        fill="none"
        stroke={cor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        // `non-scaling-stroke` mantém a espessura em 2px de verdade. Sem isso,
        // o `preserveAspectRatio="none"` estica o traço junto com a caixa e a
        // linha fica grossa na horizontal e fina na vertical.
        vectorEffect="non-scaling-stroke"
      />
    </svg>

      {/*
        O ponto do fim mora FORA do SVG.

        Dentro, ele seria um <circle> dentro de uma caixa esticada por
        `preserveAspectRatio="none"` — e a mesma distorção que faz a curva caber
        em qualquer largura transformaria o círculo numa elipse achatada. Aqui
        ele é um elemento comum, posicionado em porcentagem: acompanha a curva e
        continua redondo.
      */}
      {pontoFinal && (
      <span
        aria-hidden="true"
        className="absolute h-2.5 w-2.5 rounded-full"
        style={{
          background: cor,
          left: `${ultimo.x}%`,
          top: `${ultimo.y}%`,
          transform: "translate(-50%, -50%)",
        }}
      />
      )}
    </div>
  );
}
