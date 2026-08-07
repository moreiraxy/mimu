"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

/**
 * Faz o elemento derivar verticalmente conforme a página rola, ancorado na
 * própria posição do elemento (não num listener global) — usa o progresso
 * de scroll do elemento dentro do viewport, então cada card se move na
 * velocidade certa independente de onde está na página. No mobile a força
 * é reduzida pela metade.
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
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const checar = () => setMobile(window.innerWidth < 640);
    checar();
    window.addEventListener("resize", checar, { passive: true });
    return () => window.removeEventListener("resize", checar);
  }, []);

  const forcaEfetiva = mobile ? strength * 0.5 : strength;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reverse ? [-forcaEfetiva, forcaEfetiva] : [forcaEfetiva, -forcaEfetiva],
  );

  const ativo = !reduzida;

  return (
    <motion.div
      ref={ref}
      style={{ y: ativo ? y : 0, willChange: ativo ? "transform" : undefined }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
