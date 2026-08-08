import { useEffect, useRef, useState } from "react";
import { Img } from "../components/Img";
import { SectionHeading } from "../components/SectionHeading";
import { useInView } from "../hooks/useInView";

/*
 * The only element the original animates inside this section is each card's
 * body copy. The card is the `Badge` component (framer-UxVOk) and its text
 * carries the appear effect declared beside it in the page bundle:
 *   Vn = { effect: { opacity: .001, x: 0, y: 10 }, tokenization: `line`,
 *          transition: { delay: .075, duration: .4, ease: [.6,0,.4,1],
 *                        type: `tween` }, trigger: `onInView`, type: `appear` }
 * Everything else here — icons, headings, cards, ticker — enters at rest.
 *
 * A seção deixou de falar de certificação corporativa (SOC 2, ISO 27001) e
 * passou a responder o que de fato preocupa quem toca um negócio de bairro:
 * "e se a internet cair", "e se eu perder o celular", "quem vê meus números".
 * Prometer selo de auditoria que a Mimu não anuncia seria inventar credencial.
 */
const REVEAL_MS = 400;
const EASE = "cubic-bezier(0.6, 0, 0.4, 1)";

const CARDS = [
  {
    icon: "xkYpV98WWniejL3UVXpMPZlXo.svg",
    title: "Funciona sem internet",
    body: "Sinal fraco no salão? A Mimu continua anotando. Quando a conexão volta, tudo sobe sozinho.",
  },
  {
    icon: "AxRl37zVWRgc5u2LvOQmm2w8Y4.svg",
    title: "Backup automático",
    body: "Seus lançamentos ficam guardados todo dia. Trocou de celular, perdeu o aparelho? Está tudo lá.",
  },
  {
    icon: "ft8nMCt6A0x2ZgSm6UJY2FtOvc.svg",
    title: "De acordo com a LGPD",
    body: "Seus dados e os dos seus clientes são tratados conforme a Lei Geral de Proteção de Dados.",
  },
  {
    icon: "DEUAbPOnYvcpeBjExgGPpuBzCk.svg",
    title: "Só você vê",
    body: "Ninguém da Mimu abre o seu movimento para olhar. Seus números são seus, e continuam sendo.",
  },
];

const CHIPS = [
  "Dados criptografados",
  "Backup diário",
  "Servidores no Brasil",
  "Exporte quando quiser",
  "Cancele quando quiser",
];

export function Security() {
  return (
    <section id="seguranca" className="w-full bg-cream py-10 lg:py-15">
      <div className="container-page flex flex-col items-center gap-10 lg:gap-15">
        <SectionHeading
          eyebrow="Segurança"
          heading={"Seus números,\nseguros e sempre com você"}
          paragraph="A Mimu guarda o movimento do seu negócio com backup diário, funciona mesmo sem internet e trata seus dados conforme a LGPD."
        />

        {/* Content Wrapper: cards then the ticker, 40px apart. */}
        <div className="flex w-full max-w-[1280px] flex-col items-center gap-10">
          {/* Desktop is a 4-up row locked to 1200/370; tablet folds to a fixed
              650px 2x2 grid; mobile stacks and lets the cards size to content. */}
          <div className="flex w-full flex-col gap-2 md:grid md:h-[650px] md:max-w-[800px] md:grid-cols-2 md:grid-rows-2 lg:flex lg:aspect-[3.24324] lg:h-auto lg:max-w-none lg:flex-row">
            {CARDS.map((card) => (
              <Card key={card.title} {...card} />
            ))}
          </div>

          <Ticker />
        </div>
      </div>
    </section>
  );
}

function Card({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  const { ref, inView } = useInView<HTMLParagraphElement>();

  return (
    <article className="flex h-full w-full flex-col items-start justify-between gap-6 overflow-clip rounded-xl bg-ink p-6">
      <Img
        src={`/img/${icon}`}
        alt=""
        width={57}
        height={57}
        className="size-[57px] object-cover"
      />

      <div className="flex w-full flex-col items-start gap-3">
        <h3 className="w-[90%] font-display text-[24px] leading-[1.25] font-extrabold tracking-[-0.03em] text-cream md:text-[26px] lg:text-[24px] xl:text-[30px]">
          {title}
        </h3>
        {/* ponytail: one block, not one span per line. `tokenization: line`
            would stagger the second line 75ms behind the first, but Framer
            gets its line boxes from per-character inline-block spans — and
            character-level boxes move the wrap points. Line 1's timing is
            exact; later lines land with it instead of 75ms after. */}
        <p
          ref={ref}
          className="w-full font-display text-[13px] leading-[1.4] font-medium tracking-[-0.02em] text-cream/70 md:text-[14px] lg:text-[15px] xl:text-base"
          style={{
            opacity: inView ? 1 : 0.001,
            transform: inView ? "none" : "translateY(10px)",
            transition: `opacity ${REVEAL_MS}ms ${EASE}, transform ${REVEAL_MS}ms ${EASE}`,
            willChange: "transform",
          }}
        >
          {body}
        </p>
      </div>
    </article>
  );
}

/**
 * Compliance strip. The original is a Framer Ticker at a fixed velocity of
 * 30px/s — not a fixed duration — so the duration is derived from the measured
 * track width instead of guessed. Two identical passes translate exactly -50%,
 * which puts the loop point on an identical frame.
 */
function Ticker() {
  const trackRef = useRef<HTMLUListElement>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const measure = () => setSeconds(el.scrollWidth / 2 / 30);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const items = [...CHIPS.entries()].flatMap(([i, label]) => [
    <Line key={`line-${i}`} />,
    <Chip key={label} label={label} />,
  ]);

  return (
    <div
      className="w-full overflow-x-clip md:max-w-[800px] lg:max-w-none"
      style={{
        // Measured mask stops: hard fade at the ends, 0.8 alpha shoulders.
        maskImage:
          "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 6.32566%, rgb(0,0,0) 53.0054%, rgba(0,0,0,0.8) 91.2655%, rgba(0,0,0,0) 100%)",
        WebkitMaskImage:
          "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 6.32566%, rgb(0,0,0) 53.0054%, rgba(0,0,0,0.8) 91.2655%, rgba(0,0,0,0) 100%)",
      }}
    >
      <ul
        ref={trackRef}
        className="marquee-track flex w-max items-center gap-6"
        style={seconds ? { animationDuration: `${seconds}s` } : undefined}
      >
        {[0, 1].map((pass) => (
          <li key={pass} className="flex shrink-0 items-center gap-6">
            {items}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 2x34 divider between chips. */
function Line() {
  return <span className="h-[34px] w-0.5 shrink-0 bg-borda" />;
}

function Chip({ label }: { label: string }) {
  return (
    <span className="flex shrink-0 items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-verde"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 6 9 17l-5-5"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      <p className="font-display text-xs leading-[1.3] font-bold whitespace-pre text-muted-strong md:text-[13px] lg:text-sm">
        {label}
      </p>
    </span>
  );
}
