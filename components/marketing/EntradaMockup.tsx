"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

/**
 * Entrada de mockups/cards: sobe 40px com um pequeno "pulo" (overshoot leve
 * no eixo Y) enquanto a opacidade sobe em paralelo — mais chamativa que o
 * SpringIn (crítico, sem overshoot) usado em texto, porque aqui o card
 * inteiro precisa "parecer que está chegando na tela". `onEntrada` dispara
 * só quando essa animação termina de verdade — é o gatilho usado pelos
 * mockups pra só começar a contar os números depois que o card já assentou,
 * em vez de contar em cima do movimento de entrada.
 */
export function EntradaMockup({
  children,
  delay = 0,
  className,
  onEntrada,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  onEntrada?: () => void;
}) {
  const reduzida = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduzida ? 0 : 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={
        reduzida
          ? { duration: 0.25, ease: "easeOut" }
          : {
              opacity: { duration: 0.6, ease: "easeOut", delay },
              y: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay },
            }
      }
      onAnimationComplete={onEntrada}
    >
      {children}
    </motion.div>
  );
}
