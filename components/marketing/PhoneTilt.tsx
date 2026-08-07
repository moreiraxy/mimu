"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";

/**
 * Leve inclinação 3D + deslocamento vertical conforme a página rola, ancorada
 * na posição do próprio elemento — o mesmo tratamento de parallax que os
 * outros cards recebem, só que combinado com o tilt (o original aplica
 * rotateX/rotateY e translateY juntos no mockup do celular). No mobile o
 * deslocamento vertical é reduzido pela metade, igual ao ParallaxFloat.
 */
export function PhoneTilt({
  className,
  strength = 20,
  children,
}: {
  className?: string;
  strength?: number;
  children: ReactNode;
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
  const rotateX = useTransform(scrollYProgress, [0, 1], [3, -3]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [1.5, -1.5]);
  const y = useTransform(scrollYProgress, [0, 1], [forcaEfetiva, -forcaEfetiva]);

  return (
    <div style={{ perspective: 1000 }}>
      <motion.div
        ref={ref}
        style={reduzida ? undefined : { rotateX, rotateY, y, willChange: "transform" }}
        className={className}
      >
        {children}
      </motion.div>
    </div>
  );
}
