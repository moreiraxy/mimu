import { spring, interpolate, Easing } from "remotion";
import { FPS } from "./roteiro";

/**
 * Molas, não durações fixas.
 *
 * O padrão é `firme`: amortecimento acima do crítico, ou seja, chega no
 * destino e para, sem passar do ponto. Elemento que só aparece não deveria
 * quicar, porque nada empurrou ele.
 *
 * `comPeso` fica reservada para o movimento que tem impulso na história: o
 * celular que entra em cena, o cartão que é jogado na mesa. Ali o exagero
 * conta algo verdadeiro sobre a força que veio antes.
 */
export const MOLA = {
  firme: { damping: 26, stiffness: 120, mass: 0.9 },
  comPeso: { damping: 17, stiffness: 120, mass: 1 },
  lenta: { damping: 30, stiffness: 60, mass: 1 },
} as const;

/** Progresso de 0 a 1 de uma mola que começa em `atraso` quadros. */
export function mola(
  frame: number,
  atraso = 0,
  config: (typeof MOLA)[keyof typeof MOLA] = MOLA.firme,
): number {
  return spring({ frame: frame - atraso, fps: FPS, config });
}

/**
 * Entrada padrão: sobe um pouco, cresce um pouco e aparece.
 *
 * Os três acontecem juntos e no mesmo tempo de propósito. Separar as durações
 * (opacidade rápida, posição lenta) faz o elemento parecer dois elementos.
 */
export function entrada(
  frame: number,
  atraso = 0,
  opcoes: { deslocamento?: number; escalaInicial?: number; config?: (typeof MOLA)[keyof typeof MOLA] } = {},
) {
  const { deslocamento = 40, escalaInicial = 0.94, config = MOLA.firme } = opcoes;
  const p = mola(frame, atraso, config);
  return {
    opacity: interpolate(p, [0, 0.6], [0, 1], { extrapolateRight: "clamp" }),
    transform: `translateY(${(1 - p) * deslocamento}px) scale(${escalaInicial + (1 - escalaInicial) * p})`,
  };
}

/**
 * Saída de cena: some antes de a próxima entrar.
 *
 * `restam` é quantos quadros faltam para o fim da cena. A saída é mais curta
 * que a entrada porque ninguém precisa acompanhar o que está indo embora.
 */
export function saida(restam: number, duracao = 10) {
  return interpolate(restam, [0, duracao], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
}
