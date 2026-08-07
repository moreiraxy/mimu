"use client";

import { ReactLenis } from "lenis/react";
import { useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Smooth-scroll da página inteira (mesma lib — Lenis — usada na referência
 * do Pierre Finance). Sem isso, o parallax por scroll fica "seco": o
 * navegador pula direto pra posição de scroll a cada frame, então qualquer
 * diferença de velocidade entre elementos é sutil demais pra perceber. Com
 * o Lenis suavizando o scroll em si, a mesma diferença de velocidade fica
 * muito mais visível — é o que dá a sensação "amanteigada".
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduzida = useReducedMotion();

  if (reduzida) return <>{children}</>;

  return (
    <ReactLenis root options={{ lerp: 0.1, duration: 1.2, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
