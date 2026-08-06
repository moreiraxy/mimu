"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Entrada com spring ao aparecer no viewport — critically damped (sem
 * overshoot), porque não é uma interação com momentum do usuário (Apple
 * reserva o "bounce" só pra gestos que carregam velocidade). Com
 * prefers-reduced-motion, vira um cross-fade curto, sem deslocamento.
 */
export function SpringIn({
  children,
  delay = 0,
  y = 24,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduzida = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduzida ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={
        reduzida
          ? { duration: 0.25, ease: "easeOut" }
          : { type: "spring", bounce: 0, duration: 0.6, delay }
      }
    >
      {children}
    </motion.div>
  );
}
