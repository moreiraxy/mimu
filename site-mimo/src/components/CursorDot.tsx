import { useEffect, useRef } from "react";

/**
 * 8px dot trailing the pointer — measured from the original: 8x8, ink fill,
 * fully round, pointer-events none, z-index 13, moved by transform.
 *
 * Position is written straight to the node in a rAF loop rather than through
 * state: a mousemove-driven setState would re-render the tree on every frame.
 */
const SIZE = 8;
const EASE = 0.18;

export function CursorDot() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Touch devices have no pointer to follow, and reduced-motion users
    // shouldn't get a chasing element.
    if (
      !window.matchMedia("(pointer: fine)").matches ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;

    const el = ref.current;
    if (!el) return;

    let targetX = -100;
    let targetY = -100;
    let x = targetX;
    let y = targetY;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const tick = () => {
      x += (targetX - x) * EASE;
      y += (targetY - y) * EASE;
      el.style.transform = `translate3d(${x - SIZE / 2}px, ${y - SIZE / 2}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    el.style.opacity = "1";

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[13] size-2 rounded-[100px] bg-ink opacity-0 will-change-transform"
    />
  );
}
