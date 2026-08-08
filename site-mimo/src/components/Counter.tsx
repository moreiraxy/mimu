import { useEffect, useState } from "react";
import { useInView } from "../hooks/useInView";

/**
 * Counts up to `value` once the stat scrolls into view.
 * `value` carries its own formatting — "3.2" keeps one decimal, "98" stays whole.
 */
export function Counter({
  prefix = "",
  value,
  suffix = "",
  duration = 1600,
  className = "",
}: {
  prefix?: string;
  value: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLParagraphElement>("-20% 0px");
  const target = Number(value);
  const decimals = value.includes(".") ? value.split(".")[1]!.length : 0;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(target);
      return;
    }

    let raf = 0;
    let start: number | null = null;
    const step = (now: number) => {
      start ??= now;
      const t = Math.min((now - start) / duration, 1);
      // ease-out: fast at first, settles into the final number
      setShown(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return (
    <p ref={ref} className={className}>
      {prefix}
      {shown.toFixed(decimals)}
      {suffix}
    </p>
  );
}
