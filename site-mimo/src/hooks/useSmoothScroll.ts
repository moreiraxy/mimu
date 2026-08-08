import { useEffect } from "react";
import Lenis from "lenis";

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
    return () => lenis.destroy();
  }, []);
}
