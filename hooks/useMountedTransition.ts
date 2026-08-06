"use client";

import { useEffect, useState } from "react";

/**
 * Mantém um elemento montado durante a transição de saída — sem isso,
 * `open=false` desmonta na hora e a animação de saída nunca chega a rodar.
 * `visible` começa false mesmo com `open=true` no primeiro frame, pra dar
 * tempo do navegador pintar o estado inicial antes da transição disparar.
 */
export function useMountedTransition(open: boolean, exitDurationMs: number) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setRendered(true);
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setVisible(true)),
      );
      return () => cancelAnimationFrame(id);
    }

    setVisible(false);
    const timeout = setTimeout(() => setRendered(false), exitDurationMs);
    return () => clearTimeout(timeout);
  }, [open, exitDurationMs]);

  return { rendered, visible };
}
