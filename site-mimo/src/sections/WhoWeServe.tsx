import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { AnimatedText } from "../components/AnimatedText";
import { Img } from "../components/Img";
import { useInView } from "../hooks/useInView";

/*
 * Every number here was read from the original, never chosen:
 *   - layout   -> all.css rules .framer-1asye11 / sknzw / q4ufwa / 12nmtfe /
 *                 mhn129 / 124lka2 (section), .framer-1i7fqem & friends
 *                 (carousel) and .framer-rlxoim & friends (card)
 *   - motion   -> the appear-animation table in index.html plus the bundle
 *                 constants Mr/Fr/Ir/Rr/zr (tweens) and $r (the layout spring).
 *
 * Type presets, four tiers (<744 / 744-1199 / 1200-1439 / >=1440):
 *   ckayli (eyebrow)   12 / 13 / 14 / 14, lh 1.3em, uppercase
 *   dpkcyd (h2)        39 / 44 / 56 / 64, lh 1.05em, -.04/-.04/-.03/-.04em
 *   z9blpo (body)      15 / 17 / 19 / 20, lh 1.3/1.3/1.4/1.3em, -.03em
 *   5rsbti (h3)        22 / 24 / 28 / 32, lh 1.2em,  -.03em
 *
 * This section deliberately does NOT use <SectionHeading>. Its title block is
 * `.framer-q4ufwa`, a bottom-aligned ROW at >=744 — heading `flex: 3 0 0`
 * (90%, max 600px) beside the paragraph `flex: 2 0 0` (max 500px), both left
 * aligned — and only collapses to a centred column below 744. Its paragraph
 * also settles at FULL ink (`__targetOpacity: 1`), not the 0.8 that every
 * other section's does. None of that is expressible through the component.
 */

/** Reveal tween shared by every animated element in the section. */
const EASE = "cubic-bezier(0.6, 0, 0.4, 1)";
const REVEAL_MS = 500;

/**
 * The variant transition Framer applies to the tabs and the progress fill:
 * `{ bounce: 0.2, duration: 0.4, type: "spring" }`. Solved to stiffness 505.6 /
 * damping 36.0 (mass 1, damping ratio 0.8) and sampled at 24 steps, so the
 * 1.5% overshoot is the original's and not an eyeballed cubic-bezier.
 */
const SPRING_MS = 400;
const SPRING =
  "linear(0, 0.0574, 0.1873, 0.3435, 0.4978, 0.635, 0.7484, 0.8369, 0.9025, 0.9487, 0.9795, 0.9985, 1.0091, 1.0139, 1.0152, 1.0142, 1.0123, 1.0099, 1.0076, 1.0055, 1.0038, 1.0024, 1.0015, 1.0008, 1.0003)";

/**
 * `Dot Background`, a canvas in the original, as a gradient tile. Its loop is
 * `for (y = ((h % 20) + 10) % 20; y <= h; y += 20)` — which always leaves the
 * last dot exactly 10px from the bottom (and right) edge, whatever the box
 * measures. A 20px tile anchored bottom-right with the dot at its centre lands
 * on the same lattice, so only the pointer-tracking ripple is dropped.
 */
const DOTS: CSSProperties = {
  opacity: 0.55,
  backgroundImage:
    "radial-gradient(circle at center, rgba(255, 255, 255, 0.12) 1.5px, rgba(255, 255, 255, 0) 1.5px)",
  backgroundSize: "20px 20px",
  backgroundPosition: "right bottom",
};

const INK_70 = "#1e1e2eb3";
const CREAM_70 = "#f7f6f3b3";
const HAIRLINE = "#1e1e2e1a";

type Slide = {
  label: string;
  heading: string;
  paragraph: string;
  quote: string;
  name: string;
  photo: { file: string; w: number; h: number; alt: string };
  /**
   * O template mostrava a logomarca do cliente aqui. Como negócio de bairro
   * raramente tem logo, o lugar passou a exibir o nome do estabelecimento em
   * texto — que é o que a Mimu de fato conhece do cliente.
   */
  negocio: string;
};

const SLIDES: Slide[] = [
  {
    label: "Salão e barbearia",
    heading: "Sua agenda e seu caixa no mesmo lugar",
    paragraph:
      "Cada horário marcado já entra como faturamento previsto. No fim do dia, a conta fecha sozinha.",
    quote:
      "“Antes eu não sabia se estava dando lucro. Hoje a Mimu me manda um resumo todo dia, e isso mudou como eu penso o salão.”",
    name: "Andréia — Salão da Andréia",
    negocio: "Salão da Andréia",
    photo: {
      file: "VP4n0N3HEflTYvIgEmpU43TdyJs.jpg",
      w: 1256,
      h: 1366,
      alt: "Mulher sorrindo enquanto usa o celular durante o expediente.",
    },
  },
  {
    label: "Mercadinho e lanchonete",
    heading: "Fiado e estoque sem caderno",
    paragraph:
      "A Mimu lembra quem te deve antes de você esquecer, e avisa quando um produto está acabando.",
    quote:
      "“Uso para controlar fiado e estoque no mesmo lugar. A Mimu lembra quem me deve antes de eu esquecer.”",
    name: "Rodrigo — Mercadinho do Rodrigo",
    negocio: "Mercadinho do Rodrigo",
    photo: {
      file: "iKpvJMIZX1gNUN2z9Psp3FJbsBs.jpg",
      w: 1024,
      h: 683,
      alt: "Pessoa concentrada organizando o dia em um tablet.",
    },
  },
  {
    label: "Autônoma",
    heading: "Trabalha por conta, mas não sozinha",
    paragraph:
      "Clientes, valores e retornos organizados sem você parar o atendimento para anotar.",
    quote:
      "“Recomendo para toda amiga que também trabalha por conta. É simples, e parece que fizeram pensando em mim.”",
    name: "Carol — Manicure da Carol",
    negocio: "Manicure da Carol",
    photo: {
      file: "VmwSRfGMKk7SftNa0lRKvsynM.jpg",
      w: 891,
      h: 1337,
      alt: "Duas pessoas conversando sobre o trabalho em um ambiente claro.",
    },
  },
];

export function WhoWeServe() {
  return (
    <section
      id="para-quem"
      className="relative flex w-full flex-col items-center gap-20 overflow-clip bg-cream py-10 lg:py-15"
    >
      {/* Container: 90%/1200px, 40px between title and carousel below 1200. */}
      <div className="container-page flex flex-col items-start gap-10 lg:gap-15">
        {/* Title Wrapper — a bottom-aligned row from 744 up, column below. */}
        <div className="flex w-full flex-col items-center gap-4 md:flex-row md:items-end md:justify-center md:gap-10 lg:gap-15">
          {/* Label & Heading, `flex: 3 0 0`. */}
          <div className="flex w-full flex-none flex-col items-center gap-4 md:w-px md:flex-[3_0_0] md:items-start lg:gap-5">
            <div className="flex w-min items-center gap-2.5">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-[100px] bg-coral"
              />
              <p className="font-display text-xs leading-[1.3] font-bold tracking-[0.1em] whitespace-pre text-coral uppercase md:text-[13px] lg:text-sm">
                Para quem é
              </p>
            </div>

            <AnimatedText
              text={"Feito para o negócio\nda sua esquina."}
              className="w-full max-w-[650px] text-center font-display text-[39px] leading-[1.05] font-extrabold tracking-[-0.04em] text-ink md:w-[90%] md:max-w-[600px] md:text-left md:text-[44px] lg:text-[56px] lg:tracking-[-0.03em] xl:text-[64px] xl:tracking-[-0.04em]"
            />
          </div>

          <Paragraph />
        </div>

        <Carousel />
      </div>
    </section>
  );
}

/**
 * `flex: 2 0 0` beside the heading. Unlike every other section's paragraph this
 * one ends at opacity 1 on full ink — the original's `__targetOpacity` is 1 and
 * its colour token has no alpha.
 */
function Paragraph() {
  const { ref, inView } = useInView<HTMLParagraphElement>();

  return (
    <p
      ref={ref}
      className="w-4/5 max-w-[550px] flex-none text-center font-display text-[15px] leading-[1.4] font-medium tracking-[-0.03em] text-ink md:w-px md:max-w-[500px] md:flex-[2_0_0] md:text-left md:text-[17px] lg:text-[19px] xl:text-[20px]"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : "translateY(10px)",
        transition: `opacity ${REVEAL_MS}ms ${EASE} 200ms, transform ${REVEAL_MS}ms ${EASE} 200ms`,
        willChange: "transform",
      }}
    >
      Salão, barbearia, mercadinho, lanchonete ou trabalho por conta: a Mimu
      entende o dia a dia de quem atende de porta aberta.
    </p>
  );
}

function Carousel() {
  const [active, setActive] = useState(0);
  const { ref, inView } = useInView<HTMLDivElement>();
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const uid = useId();

  const tabId = (i: number) => `${uid}-tab-${i}`;
  const panelId = (i: number) => `${uid}-panel-${i}`;

  function onKeyDown(e: KeyboardEvent) {
    const last = SLIDES.length - 1;
    const next =
      e.key === "ArrowRight"
        ? (active + 1) % SLIDES.length
        : e.key === "ArrowLeft"
          ? (active + last) % SLIDES.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? last
              : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  }

  const slide = SLIDES[active]!;

  return (
    <div ref={ref} className="flex w-full flex-col items-center gap-5 lg:gap-8">
      {/* Tab Menu row: tabs left, progress right, both sitting on the baseline. */}
      <div className="flex w-full flex-row items-end justify-between">
        <div
          role="tablist"
          aria-label="Para quem é a Mimu"
          onKeyDown={onKeyDown}
          className="flex w-px flex-[1_0_0] flex-wrap items-center justify-center gap-2 lg:w-min lg:flex-none lg:flex-nowrap lg:justify-start"
        >
          {SLIDES.map((s, i) => (
            <button
              key={s.label}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={tabId(i)}
              aria-selected={i === active}
              aria-controls={panelId(i)}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={`relative flex w-min cursor-pointer flex-row items-center justify-start gap-4 overflow-clip rounded-[1000px] border px-5 py-3 ${
                i === active
                  ? "border-coral bg-coral"
                  : "border-borda bg-superficie"
              }`}
              style={{ transition: `background-color ${SPRING_MS}ms ${SPRING}` }}
            >
              <span className="relative block overflow-clip">
                <span
                  className={`relative block w-auto font-display text-[13px] leading-[1.3] font-bold whitespace-pre tracking-[-0.02em] md:text-[14px] lg:text-[15px] xl:text-base ${
                    i === active ? "text-white" : "text-ink opacity-65"
                  }`}
                  style={{
                    transition: `color ${SPRING_MS}ms ${SPRING}, opacity ${SPRING_MS}ms ${SPRING}`,
                  }}
                >
                  {s.label}
                </span>
              </span>
            </button>
          ))}
        </div>

        {/* Progress Bar — the original only renders it on the Desktop variants. */}
        <div className="hidden w-min flex-none flex-row items-center justify-start gap-4 overflow-clip lg:flex">
          <div className="relative flex w-[66px] flex-none flex-col items-center justify-center overflow-clip rounded-[100px]">
            <span
              className="absolute top-[calc(50%-3px)] left-0 z-[1] h-1.5 flex-none bg-coral"
              style={{
                width: `${((active + 1) / SLIDES.length) * 100}%`,
                transition: `width ${SPRING_MS}ms ${SPRING}`,
              }}
            />
            <span
              className="relative h-[5px] w-full flex-none"
              style={{ backgroundColor: HAIRLINE }}
            />
          </div>
          <p className="w-auto font-display text-[15px] leading-[1.3] font-bold whitespace-pre tracking-[-0.02em] text-ink xl:text-base">
            {active + 1}/{SLIDES.length}
          </p>
        </div>
      </div>

      {/* Tab Content: `aspect-ratio: 2.25` is what makes the card 533.33px tall
          in a 1200px container, and 533 is what closes the section. */}
      <div className="flex w-full flex-col items-center justify-center lg:aspect-[2.25] lg:min-h-[380px]">
        <div className="w-full flex-none lg:h-px lg:flex-[1_0_0]">
          {/* Remounting on both the slide and the first scroll-in replays the
              staggered reveal, exactly when Framer's appear animations run. */}
          <Card
            key={`${active}-${inView}`}
            slide={slide}
            play={inView}
            id={panelId(active)}
            labelledBy={tabId(active)}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * One element of the card reveal. Every one starts at `{ opacity: .001, x: 5 }`
 * and tweens 500ms on the shared ease; only the delay and the settled opacity
 * differ, and both come from the appear table.
 */
function Reveal({
  delay,
  to = 1,
  play,
  className,
  style,
  children,
  as: Tag = "div",
}: {
  delay: number;
  to?: number;
  play: boolean;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  as?: "div" | "p" | "h3";
}) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!play) return;
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, [play]);

  return (
    <Tag
      className={className}
      style={{
        ...style,
        opacity: on ? to : 0.001,
        transform: on ? "none" : "translateX(5px)",
        transition: `opacity ${REVEAL_MS}ms ${EASE} ${delay}ms, transform ${REVEAL_MS}ms ${EASE} ${delay}ms`,
        willChange: "transform",
      }}
    >
      {children}
    </Tag>
  );
}

function Card({
  slide,
  play,
  id,
  labelledBy,
}: {
  slide: Slide;
  play: boolean;
  id: string;
  labelledBy: string;
}) {
  return (
    <div
      role="tabpanel"
      id={id}
      aria-labelledby={labelledBy}
      tabIndex={0}
      className="flex w-full flex-col items-center justify-center gap-3 overflow-clip lg:h-full lg:flex-row"
    >
      {/* Content Card — `flex: 2.5 0 0` over a 1188px track, but its 8px of
          padding floors the flex base, which is why it lands on 813. */}
      <div className="flex w-full flex-none flex-col items-center justify-center overflow-clip rounded-xl bg-sand p-2 lg:h-full lg:w-px lg:flex-[2.5_0_0] lg:flex-row">
        <div className="flex w-full flex-none flex-col items-start justify-start gap-[9px] overflow-clip p-4 lg:h-full lg:w-px lg:flex-[1_0_0] lg:justify-between lg:gap-0 lg:p-5">
          <div className="flex w-[95%] flex-none flex-col items-start justify-center gap-3">
            <Reveal
              as="p"
              play={play}
              delay={100}
              className="w-full font-display text-[13px] leading-[1.3] font-bold tracking-[-0.02em] md:text-[14px] lg:text-[15px] xl:text-base"
              style={{ color: INK_70 }}
            >
              {slide.label}
            </Reveal>

            {/* `[text-wrap:wrap]` cancels the global `balance` on headings: the
                original resolves `--framer-text-wrap` to nothing, so it wraps
                greedily. */}
            <Reveal
              as="h3"
              play={play}
              delay={200}
              className="w-full font-display text-[22px] leading-[1.2] font-extrabold tracking-[-0.03em] text-ink [text-wrap:wrap] md:text-[24px] lg:text-[28px] xl:text-[32px]"
            >
              {slide.heading}
            </Reveal>
          </div>

          <Reveal
            as="p"
            play={play}
            delay={300}
            className="w-[90%] flex-none font-display text-[15px] leading-[1.4] font-medium tracking-[-0.03em] md:text-[17px] lg:w-[95%] lg:text-[19px] xl:text-[20px]"
            style={{ color: INK_70 }}
          >
            {slide.paragraph}
          </Reveal>
        </div>

        <div className="aspect-[1.04] max-h-[400px] w-full flex-none overflow-clip rounded-lg lg:aspect-auto lg:h-full lg:max-h-none lg:w-px lg:flex-[1_0_0]">
          <Img
            src={`/img/${slide.photo.file}`}
            alt={slide.photo.alt}
            width={slide.photo.w}
            height={slide.photo.h}
            className="size-full object-cover"
          />
        </div>
      </div>

      {/* Testimonial Card — `flex: 1 0 0` plus a 28px padding floor, so 375. */}
      <div className="relative flex w-full flex-none flex-col items-start justify-center gap-10 overflow-clip rounded-xl bg-ink p-6 lg:h-full lg:w-px lg:flex-[1_0_0] lg:justify-between lg:gap-0 lg:p-7">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={DOTS}
        />

        {/* No lugar da logomarca do template, o nome do negócio: é o que um
            salão de bairro tem, e é o que o cliente reconhece. */}
        <Reveal
          play={play}
          delay={200}
          to={0.75}
          as="p"
          className="relative w-auto flex-none font-display text-[13px] leading-[1.3] font-bold tracking-[0.08em] text-cream uppercase lg:text-sm"
        >
          {slide.negocio}
        </Reveal>

        <div className="relative flex w-full flex-none flex-col items-start justify-center gap-5">
          <Reveal
            as="p"
            play={play}
            delay={300}
            className="w-full font-display text-[15px] leading-[1.4] font-medium tracking-[-0.03em] text-cream md:text-[17px] lg:text-[19px] xl:text-[20px]"
          >
            {slide.quote}
          </Reveal>

          <Reveal
            as="p"
            play={play}
            delay={500}
            className="w-[90%] font-display text-[13px] leading-[1.3] font-medium tracking-[-0.02em] md:text-[14px] lg:w-full lg:text-[15px] xl:text-base"
            style={{ color: CREAM_70 }}
          >
            {slide.name}
          </Reveal>
        </div>
      </div>
    </div>
  );
}
