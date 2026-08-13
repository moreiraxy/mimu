import { useEffect } from "react";
import Lenis from "lenis";

declare global {
  interface Window {
    /** Exposto só pro Preloader travar/destravar o scroll durante a intro
        — Lenis rola a página via transform, então `overflow:hidden` no
        body sozinho não segura wheel/touch por baixo dele. */
    __lenis?: Lenis;
  }
}

/**
 * The original runs Lenis (its <html> carries `lenis lenis-autoToggle`), so the
 * scroll feel is part of the design, not a nicety. Same library, same defaults.
 *
 * autoToggle mirrors the original's class: Lenis suspends itself while a nested
 * scrollable region has the pointer, so overflow areas still scroll natively.
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({ autoRaf: true, autoToggle: true });
    window.__lenis = lenis;
    return () => {
      window.__lenis = undefined;
      lenis.destroy();
    };
  }, []);
}
