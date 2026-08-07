"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Conta de 0 até `valor` com easing de desaceleração via requestAnimationFrame.
 * Controlado pelo pai via `ativo` (não observa o próprio viewport) — assim o
 * mesmo gatilho que revela a mensagem/card também dispara a contagem, e ao
 * voltar `ativo` pra false (ex.: reinício de loop) a contagem reseta pra 0,
 * pronta pra contar de novo no próximo ciclo.
 */
export function ContagemNumero({
  valor,
  formatar = (n) => Math.round(n).toString(),
  duracao = 1200,
  ativo = true,
  className,
}: {
  valor: number;
  formatar?: (n: number) => string;
  duracao?: number;
  ativo?: boolean;
  className?: string;
}) {
  const [exibido, setExibido] = useState(0);
  const reduzida = useReducedMotion();

  useEffect(() => {
    if (!ativo) {
      setExibido(0);
      return;
    }
    if (reduzida) {
      setExibido(valor);
      return;
    }
    let frame: number;
    const inicio = performance.now();
    const passo = (agora: number) => {
      const progresso = Math.min((agora - inicio) / duracao, 1);
      const suavizado = 1 - Math.pow(1 - progresso, 3);
      setExibido(valor * suavizado);
      if (progresso < 1) frame = requestAnimationFrame(passo);
    };
    frame = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(frame);
  }, [ativo, valor, duracao, reduzida]);

  return <span className={className}>{formatar(exibido)}</span>;
}
