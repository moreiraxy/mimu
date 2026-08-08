import type { ElementType } from "react";
import { useInView } from "../hooks/useInView";

/**
 * Reveals a heading word by word as it scrolls in.
 * Words (not characters) keep the DOM small — a 12-word heading is 12 spans
 * instead of ~60, and the visual result at these sizes is the same.
 * Line breaks are expressed with "\n" in `text`.
 */
/**
 * Timing comes from the original's own motion config, not from taste:
 * 0.5s tween on cubic-bezier(0.6, 0, 0.4, 1), words offset 50ms apart.
 */
const REVEAL_MS = 500;
const REVEAL_EASE = "cubic-bezier(0.6, 0, 0.4, 1)";

export function AnimatedText({
  text,
  as: Tag = "h2",
  className = "",
  stagger = 50,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  stagger?: number;
}) {
  const { ref, inView } = useInView<HTMLHeadingElement>();

  let index = 0;
  const lines = text.split("\n");

  return (
    <Tag ref={ref} className={className}>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((word) => {
            const delay = index++ * stagger;
            return (
              <span
                key={`${li}-${index}`}
                className="inline-block overflow-hidden align-bottom"
              >
                <span
                  className="inline-block will-change-transform"
                  style={{
                    transform: inView ? "translateY(0)" : "translateY(100%)",
                    opacity: inView ? 1 : 0,
                    transition: `transform ${REVEAL_MS}ms ${REVEAL_EASE} ${delay}ms, opacity ${REVEAL_MS}ms ${REVEAL_EASE} ${delay}ms`,
                  }}
                >
                  {word}
                </span>
                <span>&nbsp;</span>
              </span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
