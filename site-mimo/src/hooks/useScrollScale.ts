import { useEffect, useRef, useState } from "react";

/**
 * Porte 1:1 do componente `Lm` do bundle de eventos.desenrol.ai
 * (clones/eventos-desenrol-ai-07fe8587/mirror/.../assets/index-BQAh_sVM.js):
 *
 *   const {scrollYProgress} = useScroll({target, offset:["start end","end start"]});
 *   const scale = useTransform(scrollYProgress, [0,.15,.85,1], [.9,1,1,.9]);
 *   <div ref={target}><motion.div style={{scale}} className="origin-top will-change-transform">
 *
 * Mesmos keyframes (0/.15/.85/1 → .9/1/1/.9) e mesma `transform-origin: top`.
 * Aqui sem framer-motion: o progresso é calculado no scroll com a mesma
 * definição de `offset` do Framer ("start end" = topo do elemento encosta na
 * base da janela; "end start" = base do elemento encosta no topo da janela).
 */
const KEYS = [0, 0.15, 0.85, 1];
const VALS = [0.9, 1, 1, 0.9];

function interpolar(p: number) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i]!;
    const b = KEYS[i + 1]!;
    if (p <= b) {
      const t = b === a ? 0 : (p - a) / (b - a);
      return VALS[i]! + (VALS[i + 1]! - VALS[i]!) * t;
    }
  }
  return VALS[VALS.length - 1]!;
}

export function useScrollScale<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [escala, setEscala] = useState(0.9);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setEscala(1);
      return;
    }

    let frame = 0;
    const medir = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // Mesmo intervalo do offset ["start end", "end start"] do Framer.
      const total = r.height + vh;
      const percorrido = vh - r.top;
      const p = Math.min(1, Math.max(0, percorrido / total));
      setEscala(interpolar(p));
    };

    const aoRolar = () => {
      if (!frame) frame = requestAnimationFrame(medir);
    };

    medir();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar, { passive: true });
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return { ref, escala };
}
