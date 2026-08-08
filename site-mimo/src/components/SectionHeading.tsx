import { AnimatedText } from "./AnimatedText";
import { useInView } from "../hooks/useInView";

/*
 * Paragraph reveal, read from the page bundle rather than chosen: enter state
 * `_s` = { opacity: 0, y: 10 }, transition `os` = delay .2s, duration .5s,
 * ease [.6, 0, .4, 1]. It settles on 0.8 opacity on the light sections, which
 * is the same 80% the static style already carried.
 */
const REVEAL_MS = 500;
const REVEAL_DELAY = 200;
const REVEAL_EASE = "cubic-bezier(0.6, 0, 0.4, 1)";

/**
 * The eyebrow + heading + paragraph block that opens nearly every section.
 * `tone` flips it for the dark sections (Features, How it works).
 */
export function SectionHeading({
  eyebrow,
  heading,
  paragraph,
  tone = "light",
  align = "center",
}: {
  eyebrow: string;
  heading: string;
  paragraph?: string;
  tone?: "light" | "dark";
  align?: "center" | "left";
}) {
  const onDark = tone === "dark";
  const centered = align === "center";

  // Below 1200px the block is always left-aligned with a 16px gap; only at
  // 1200+ does `align` decide, at 20px. Straight from the original's CSS.
  return (
    <div
      className={`flex flex-col items-start gap-4 text-left lg:gap-5 ${
        centered ? "lg:items-center lg:text-center" : ""
      }`}
    >
      {/* The eyebrow is a dot plus uppercase mono text, 10px apart — the dot is
          a real element in the original, not decoration we can skip. */}
      <div
        className={`flex items-center gap-2.5 ${onDark ? "text-cream" : "text-ink"}`}
      >
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-[100px] bg-current"
        />
        <p className="font-mono text-xs leading-[1.3] font-medium uppercase md:text-[13px] lg:text-sm lg:leading-[18.2px]">
          {eyebrow}
        </p>
      </div>

      {/* w-full matters: without it the flex column shrinks the box to the
          longest line and the measured width stops matching the original. */}
      {/* Four tiers, not three: 1200-1439 is its own override at 56px and only
          >=1440 reaches 64px. Tracking is -0.04em everywhere except that tier. */}
      <AnimatedText
        text={heading}
        className={`w-full max-w-[850px] font-display text-[39px] leading-[1.05] font-medium tracking-[-0.04em] md:text-[44px] lg:text-[56px] lg:tracking-[-0.03em] xl:text-[64px] xl:tracking-[-0.04em] ${onDark ? "text-cream" : "text-ink"}`}
      />

      {/* Preset z9blpo: 15/17/19/20 across the four tiers, 1.4em line-height
          only in the 1200-1439 band, and ink at 80% opacity — not a 0.7 alpha.
          The dark sections carry full cream instead. */}
      {paragraph && <Paragraph text={paragraph} onDark={onDark} />}
    </div>
  );
}

/**
 * Split out so the reveal gets its own observer without re-rendering the
 * heading beside it. Rest opacity is 0.8 on light, 1 on dark — the same values
 * the static style carried, now as the tween's target.
 */
function Paragraph({ text, onDark }: { text: string; onDark: boolean }) {
  const { ref, inView } = useInView<HTMLParagraphElement>();
  const rest = onDark ? 1 : 0.8;

  return (
    <p
      ref={ref}
      className={`w-full max-w-[650px] font-display text-[15px] leading-[1.3] font-medium tracking-[-0.03em] md:text-[17px] lg:text-[19px] lg:leading-[1.4] xl:text-[20px] xl:leading-[1.3] ${
        onDark ? "text-cream" : "text-ink"
      }`}
      style={{
        opacity: inView ? rest : 0,
        transform: inView ? "none" : "translateY(10px)",
        transition: `opacity ${REVEAL_MS}ms ${REVEAL_EASE} ${REVEAL_DELAY}ms, transform ${REVEAL_MS}ms ${REVEAL_EASE} ${REVEAL_DELAY}ms`,
      }}
    >
      {text}
    </p>
  );
}
