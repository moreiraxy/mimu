import { useEffect, useRef } from "react";

/**
 * Porta de components/marketing/PhoneTilt.tsx (app principal) sem depender de
 * `motion/react` — site-mimo não tem framer-motion instalado, só `gsap` e um
 * loop `requestAnimationFrame` próprio (ver useParallaxFloat.ts), então aqui
 * segue o mesmo padrão: um `rAF` lendo `getBoundingClientRect` a cada frame.
 *
 * Mesmo mapeamento do original — progresso 0→1 do elemento cruzando o
 * viewport ("start end" → "end start"): rotateX 3°→-3°, rotateY 1.5°→-1.5°.
 * Isolado num nó próprio (não o mesmo de `data-parallax`) porque os dois
 * escrevem `transform` imperativamente; num único nó um pisaria no outro.
 */
export function useScrollTilt<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;

    function clamp(n: number, a: number, b: number) {
      return Math.max(a, Math.min(b, n));
    }

    function tick() {
      rafId = 0;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // "start end" (top of el meets bottom of viewport) = 0
      // "end start" (bottom of el meets top of viewport) = 1
      const progresso = clamp((vh - rect.top) / (vh + rect.height), 0, 1);

      const rotateX = 3 + progresso * (-3 - 3);
      const rotateY = 1.5 + progresso * (-1.5 - 1.5);

      el.style.transform = `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg)`;
    }

    function onScroll() {
      if (!rafId) rafId = requestAnimationFrame(tick);
    }

    el.style.willChange = "transform";
    tick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return ref;
}
