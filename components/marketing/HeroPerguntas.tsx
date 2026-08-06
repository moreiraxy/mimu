"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const PERGUNTAS = [
  "Você sabe quanto vai faturar essa semana?",
  "Quantos clientes te devem agora?",
  "Você lembra de todos os agendamentos de amanhã?",
] as const;

const INTERVALO_MS = 3200;

export function HeroPerguntas() {
  const [indice, setIndice] = useState(0);
  const reduzida = useReducedMotion();

  useEffect(() => {
    const id = setInterval(() => {
      setIndice((atual) => (atual + 1) % PERGUNTAS.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex h-8 items-center justify-center overflow-hidden sm:h-9">
      <AnimatePresence mode="wait">
        <motion.p
          key={indice}
          initial={{ opacity: 0, y: reduzida ? 0 : 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: reduzida ? 0 : -14 }}
          transition={
            reduzida
              ? { duration: 0.2, ease: "easeOut" }
              : { type: "spring", bounce: 0, duration: 0.45 }
          }
          className="text-base font-semibold text-coral sm:text-lg"
        >
          {PERGUNTAS[indice]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
