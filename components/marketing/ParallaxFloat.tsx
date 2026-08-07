"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

/**
 * Faz o elemento derivar verticalmente conforme a página rola, ancorado na
 * própria posição do elemento (não num listener global) — usa o progresso
 * de scroll do elemento dentro do viewport, então cada card se move na
 * velocidade certa independente de onde está na página.
 */
export function ParallaxFloat({
  children,
  strength = 24,
  reverse = false,
  className,
}: {
  children: ReactNode;
  strength?: number;
  /** Inverte o sentido do deslocamento — usado nas ilustrações, que derivam pra baixo em vez de pra cima. */
  reverse?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduzida = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reverse ? [-strength, strength] : [strength, -strength],
  );

  return (
    <motion.div
      ref={ref}
      style={{ y: reduzida ? 0 : y, willChange: reduzida ? undefined : "transform" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
