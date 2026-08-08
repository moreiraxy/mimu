import { useState } from "react";
import { Link } from "react-router";
import { AnimatedText } from "../components/AnimatedText";
import { Header } from "../components/Header";
import { Img } from "../components/Img";
import { Cta } from "../sections/Cta";
import { Footer } from "../sections/Footer";
import { CATEGORIES, STORIES, type Story } from "../data/customerStories";
import { useInView } from "../hooks/useInView";

/*
 * /customer-stories — the index.
 *
 * Every number is read from this route's own CSS (the page ships its own
 * stylesheet, not the home page's all.css), parsed with brace control so a
 * BASE rule is never mistaken for a media block's:
 *   hero     -> .framer-1uy2aar / 8msa0e / ej574j / vnuvu6 / b43vpt / l8peod
 *   slide    -> .framer-168nudo-container and the .framer-a9d7O component scope
 *   logos    -> .framer-je3bbi / rwgmou / ubx8cn / 1f1v6eg / 1022bes / ihz0ti
 *   grid     -> .framer-1mxg0hz / f4pqej / 1gnu9wv / 2zyd7i / wyen2o / afh3sz
 *   card     -> the .framer-W1OZa component scope (see StoryCard)
 *
 * Colours are the resolved Framer tokens, not the inline rgb() fallbacks the
 * markup carries — those two disagree (the button's fallback says rgb(24,24,24)
 * where the token is #1e1e2e):
 *   #1e1e2e ink   #f7f6f3 cream   #ece9e2 sand   #2a2a3d ink-soft
 *   #1e1e2e0d 5%  #1e1e2e1a 10%   #1e1e2e4d 30%  #1e1e2e80 50%  #1e1e2ed9 85%
 *   #f7f6f34d 30% #f7f6f380 50%   #f7f6f3b3 70%  #ece9e280 50%
 *
 * Four type tiers, not three — 1200-1439 is its own band and only >=1440 hits
 * the top size, so `lg:` is the third tier and `xl:` the fourth:
 *   zucctp  hero h1   40 / 52 / 58 / 64  lh 1.1em  w500  ls -.03em
 *   z9blpo  intro     15 / 17 / 19 / 20  lh 1.3/1.3/1.4/1.3em  w500  ls -.03em
 *   lajpag  pull      22 / 25 / 28 / 31  lh 1.3/1.2/1.2/1.2em  w500  ls -.03em
 *   5rsbti  card h3   22 / 24 / 28 / 32  lh 1.2em  w500  ls -.03em
 *   1req7v1 metric    24 / 28 / 36 / 36  lh 1.1em  w500  ls -.02em
 *   168zpc5 label     15 / 16 / 17 / 18  lh 1.3/1.3/1.4/1.3em  w500  ls -.02em
 *   s9koru  body/btn  13 / 14 / 15 / 16  lh 1.3em  w500  ls -.02em
 *   ckayli  eyebrow   12 / 13 / 14 / 14  lh 1.3em  w500  ls 0  Geist Mono, upper
 *
 * The card grid is NOT the home page's sticky pile: `.framer-wyen2o` is a real
 * 2-column grid (1 below 744) and the cards' `position: sticky` never engages
 * because each sits alone in its own grid cell.
 */

const EASE = "cubic-bezier(0.6, 0, 0.4, 1)";
const REVEAL_MS = 500;

/** Framer's `data-border` hairline: an inset ::after, so it never resizes the box. */
export const RING =
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-['']";

/* The slideshow's other two slides are not in this route's markup — the SSR
   pass ships slide 1 only and the JS bundle holds the rest. Slide 1 is
   reproduced exactly; the wheel that advances it is left out rather than
   invented. */
const SLIDE = {
  image: {
    file: "AeRcUuogo8PqQ4xMEzB8fSQo3c.jpg",
    alt: "Pintura em aquarela de colinas verdes sob um céu nublado.",
    w: 4297,
    h: 3159,
  },
  href: "/historias/salao-da-andreia",
  quote:
    "“Antes eu não sabia se estava dando lucro. Hoje a Mimu me manda um resumo todo dia, e isso mudou como eu penso o salão.”",
  avatar: {
    file: "WXyn7lOXcfhlfB9BfdUN8clhx4.png",
    alt: "",
    w: 498,
    h: 540,
  },
  name: "Andréia",
  role: "Salão da Andréia",
  /** No lugar da logomarca do template, o nome do negócio — ver o comentário
      em sections/CustomerStories.tsx sobre por que negócio de bairro não tem
      logo para exibir. */
  negocio: "Salão da Andréia",
};

/* The ticker's six logos. Height is fixed at 28px by `.framer-1umyk35`, so each
   width is 28 x the aspect-ratio the markup authors on that logo's box. */
const LOGOS = [
  { file: "vUm0vA8Dmi1IMLYCkSq3igQufj0.png", w: 103 },
  { file: "RGWerGYxB7gPSTeSaNBn9AHsHs.png", w: 108 },
  { file: "U33wYOhqq6O4vefxlMnUx0olQpM.png", w: 95 },
  { file: "P2IsyypkpTAE44YCupLqzwsXIbc.png", w: 110 },
  { file: "FGRs57VIqVv8f6o8Tk6T5IIYL8.png", w: 140 },
  { file: "AIMSVje1JIVczKzZE97Em3GNiA.png", w: 116 },
];

export default function CustomerStories() {
  // "Todas" é a primeira entrada de CATEGORIES e o estado inicial; as demais
  // filtram por `card.label`, que é sempre igual a `category`.
  const [tab, setTab] = useState("Todas");
  const shown =
    tab === "Todas" ? STORIES : STORIES.filter((s) => s.card.label === tab);

  return (
    <>
      <Header />
      <main>
        <Hero />

        {/* padding 40/40/60/60 top, a flat 100 bottom; gap 40 below 1200. */}
        <section
          id="historias"
          className="relative flex w-full flex-col items-center justify-start overflow-visible bg-cream pt-10 pb-25 lg:pt-15"
        >
          <div className="container-page flex flex-col items-center gap-10 lg:gap-15">
            {/* Label & tabs: one row from 744 up, a stack below it with the
                tabs moved above the label (order 1 / order 0). */}
            <div className="flex w-full flex-none flex-col items-start justify-center gap-5 overflow-clip md:flex-row md:gap-4 lg:gap-5">
              <div className="order-0 flex w-min flex-none items-center gap-2.5 text-coral md:order-none">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-[100px] bg-current"
                />
                <p className="font-display text-xs leading-[1.3] font-bold tracking-[0.1em] whitespace-pre uppercase md:text-[13px] lg:text-sm">
                  Histórias
                </p>
              </div>

              <div className="order-1 flex w-full flex-none flex-wrap items-center justify-start gap-2.5 md:order-none md:w-px md:flex-[1_0_0] md:justify-end">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setTab(c)}
                    aria-pressed={tab === c}
                    className={`flex w-min cursor-pointer items-start justify-start gap-2.5 rounded-[1000px] px-4 py-2 font-display text-[15px] leading-[1.3] font-bold tracking-[-0.02em] whitespace-pre transition-colors md:text-base lg:text-[17px] lg:leading-[1.4] xl:text-[18px] xl:leading-[1.3] ${
                      tab === c
                        ? "bg-coral text-white"
                        : "border border-borda bg-superficie text-ink hover:border-coral hover:text-coral"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <ul className="grid w-full grid-cols-1 justify-center gap-4 md:grid-cols-2">
              {shown.map((story) => (
                <li key={story.slug} className="w-full">
                  <StoryCard story={story} />
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Cta />
      </main>
      <Footer />
    </>
  );
}

function Hero() {
  const { ref, inView } = useInView<HTMLDivElement>();

  /* The paragraph and the CTA ship as opacity:.001 / translateY(10px) in the
     SSR markup and enter together, behind the heading. */
  const reveal = {
    opacity: inView ? 1 : 0,
    transform: inView ? "none" : "translateY(10px)",
    transition: `opacity ${REVEAL_MS}ms ${EASE} 200ms, transform ${REVEAL_MS}ms ${EASE} 200ms`,
    willChange: "transform",
  };

  return (
    /* padding 100/0/40 -> 120/0/40 -> 160/0/60. */
    <section className="relative flex w-full flex-col items-center justify-center overflow-clip bg-cream pt-25 pb-10 md:pt-30 lg:pt-40 lg:pb-15">
      <div className="container-page flex flex-col items-center justify-center gap-10 lg:gap-15">
        {/* Heading and subtext sit side by side from 744 up, 2fr against 1fr. */}
        <div
          ref={ref}
          className="flex w-full flex-none flex-col items-center justify-center gap-4 md:flex-row md:items-end md:gap-10"
        >
          <AnimatedText
            as="h1"
            text="Veja como negócios de bairro usam a Mimu todo dia."
            className="w-full max-w-[650px] text-center font-display text-[40px] leading-[1.1] font-extrabold tracking-[-0.03em] text-ink md:w-px md:max-w-[850px] md:flex-[2_0_0] md:text-left md:text-[52px] lg:text-[58px] xl:text-[64px]"
          />

          <div className="flex w-full flex-none flex-col items-center gap-[22px] md:w-px md:flex-[1_0_0] md:items-start">
            <p
              className="w-[90%] max-w-[550px] text-center font-display text-[15px] leading-[1.4] font-medium tracking-[-0.03em] text-[#1e1e2ed9] md:w-full md:max-w-[650px] md:text-left md:text-[17px] lg:text-[19px] xl:text-[20px]"
              style={reveal}
            >
              Salão, mercadinho, barbearia e trabalho por conta: quem já trocou
              o caderno pela Mimu conta o que mudou.
            </p>

            <div style={reveal}>
              <Pill to="/contato" tone="dark">
                Começar grátis
              </Pill>
            </div>
          </div>
        </div>

        <Slide />
        <LogoStrip />
      </div>
    </section>
  );
}

/**
 * The hero's featured slide.
 *
 * MEDIR: this is a 3-slide carousel in the original and only slide 1 is in the
 * route's HTML — the other two live in the JS bundle, as does whatever drives
 * the progress fill (`transition: width 40ms linear` on a 0%-wide bar). The
 * pills are rendered in their shipped state: slide 1 active at 48x10 on a 50%
 * cream track, slides 2 and 3 idle at 10x10 solid white.
 */
function Slide() {
  return (
    <div className="relative h-[466px] w-full flex-none md:h-[449px] lg:aspect-[2.4] lg:h-auto">
      <div className="relative flex size-full flex-row items-start justify-between overflow-clip rounded-xl p-6">
        <Img
          src={`/img/${SLIDE.image.file}`}
          alt={SLIDE.image.alt}
          width={SLIDE.image.w}
          height={SLIDE.image.h}
          priority
          sizes="(min-width: 1200px) 1200px, 90vw"
          className="absolute inset-0 size-full rounded-[inherit] object-cover object-[right_bottom]"
        />

        {/* The scrim's first stop moves 21% -> 0% and the last 112% -> 114%
            below 744; both are authored inline, not in a class. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 size-full overflow-clip opacity-80 md:hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(30, 30, 46, 0) 0%, #1e1e2e 114%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 hidden size-full overflow-clip opacity-80 md:block"
          style={{
            background:
              "linear-gradient(180deg, rgba(30, 30, 46, 0) 21%, #1e1e2e 112%)",
          }}
        />

        <div className="relative z-1 flex h-full w-px flex-[1_0_0] flex-col items-start justify-end gap-6">
          {/* Pinned top-right; from 744 up it swings out 32px past the card
              edge and rotates a quarter turn, so it reads down the side. */}
          <div className="absolute top-0 right-0 z-2 flex w-min items-center md:top-1/2 md:right-[-32px] md:-translate-y-1/2 md:rotate-90">
            <div className="z-1 flex w-min items-center gap-1">
              <Pip active />
              <Pip />
              <Pip />
            </div>
          </div>

          <div className="flex h-px w-full flex-[1_0_0] flex-col items-start justify-center gap-5">
            <Link
              to={SLIDE.href}
              className="flex h-px w-full flex-[1_0_0] flex-col items-end justify-start gap-2.5 no-underline md:flex-row"
            >
              {/* Below 744 the logo moves above the quote (order 0 / order 1). */}
              <div className="order-1 w-full flex-none md:order-none md:w-px md:flex-[1_0_0]">
                <figure className="flex w-full flex-col items-start justify-end gap-7">
                  <blockquote className="w-full flex-none font-display text-[22px] leading-[1.3] font-medium tracking-[-0.03em] break-words whitespace-pre-wrap text-cream md:text-[25px] md:leading-[1.2] lg:text-[28px] xl:text-[31px]">
                    {SLIDE.quote}
                  </blockquote>

                  <div className="flex w-full flex-none items-end justify-start gap-3">
                    <span className="relative aspect-square w-14 flex-none overflow-clip rounded-[1000px]">
                      <Img
                        src={`/img/${SLIDE.avatar.file}`}
                        alt={SLIDE.avatar.alt}
                        width={SLIDE.avatar.w}
                        height={SLIDE.avatar.h}
                        sizes="56px"
                        className="absolute inset-0 size-full rounded-[inherit] object-cover object-center"
                      />
                    </span>

                    <figcaption className="flex w-px flex-[1_0_0] flex-col items-center gap-1 overflow-clip">
                      <p className="w-full flex-none font-display text-[15px] leading-[1.3] font-medium tracking-[-0.03em] break-words whitespace-pre-wrap text-cream opacity-80 md:text-[17px] lg:text-[19px] lg:leading-[1.4] xl:text-[20px] xl:leading-[1.3]">
                        {SLIDE.name}
                      </p>
                      <p className="w-full flex-none font-display text-[13px] leading-[1.3] font-medium tracking-[-0.02em] break-words whitespace-pre-wrap text-cream opacity-60 md:text-[14px] lg:text-[15px] xl:text-base">
                        {SLIDE.role}
                      </p>
                    </figcaption>
                  </div>
                </figure>
              </div>

              <div className="order-0 z-1 flex h-px w-full flex-[1_0_0] flex-col items-start justify-start md:order-none md:h-full md:w-px md:items-end md:justify-end">
                <p className="font-display text-base leading-[1.2] font-extrabold tracking-[-0.02em] text-cream md:text-lg">
                  {SLIDE.negocio}
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** A progress pill: 48x10 while its slide runs, 10x10 once it is done. */
function Pip({ active = false }: { active?: boolean }) {
  return (
    <div className="flex w-min items-center">
      <div
        className={`relative h-2.5 overflow-hidden rounded-[34px] ${
          active ? "w-12 bg-[#f7f6f380]" : "w-2.5 bg-white"
        }`}
      >
        {active && (
          <div
            className="absolute top-0 left-0 h-full w-0 rounded-[34px] bg-white"
            style={{ transition: "width 40ms linear" }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Client logo ticker. This route uses the component's "Black" variant, which
 * flanks the label with two dotted rules — the home page's strip has none, so
 * the shared <Logos> section is deliberately not reused here.
 */
function LogoStrip() {
  return (
    <div className="flex w-full flex-none flex-col items-center justify-start gap-8">
      <div className="z-1 flex w-full flex-none items-center justify-center gap-5">
        <Rule />
        <p className="w-auto flex-none font-display text-xs leading-[1.3] font-bold tracking-[0.08em] whitespace-pre text-muted uppercase md:text-[13px] lg:text-sm">
          Mais de 400 negócios de bairro já contam com a Mimu
        </p>
        <Rule />
      </div>

      {/* The seam is hidden by the original's own five-stop mask, not the
          8%/92% one the shared marquee utility carries. */}
      <div
        className="flex w-full items-center overflow-x-clip opacity-70"
        style={{
          maskImage:
            "linear-gradient(90deg, rgba(0,0,0,0) 2%, rgba(0,0,0,0.8) 22%, rgb(0,0,0) 49.62%, rgba(0,0,0,0.8) 76.03%, rgba(0,0,0,0) 97%)",
        }}
      >
        <ul className="marquee-track flex w-max items-center gap-[60px]">
          {/* Two identical passes, so translating exactly -50% lands on the
              same frame the loop started on. */}
          {[0, 1].map((pass) =>
            LOGOS.map((logo) => (
              <li key={`${pass}-${logo.file}`} className="shrink-0">
                <Img
                  src={`/img/${logo.file}`}
                  alt=""
                  width={logo.w}
                  height={28}
                  className="h-7 w-auto object-contain"
                />
              </li>
            )),
          )}
        </ul>
      </div>
    </div>
  );
}

/** The dotted rule beside the ticker label: a 1px box wearing a 2px dotted ::after. */
function Rule() {
  return (
    <div
      aria-hidden="true"
      className={`relative z-1 h-px w-px flex-[1_0_0] overflow-clip after:border-2 after:border-dotted after:border-borda ${RING}`}
    />
  );
}

/**
 * The grid card, shared with the "Other stories" strip on each case page.
 *
 * Two variants exist and they map to a single breakpoint: Desktop from 1200 up,
 * Tablet below it. They differ in exactly three numbers — the content box's
 * min-height (190 / 200), the footer row's gap (40 / 20) and the metric
 * column's gap (8 / 4). Everything else is shared.
 */
export function StoryCard({ story }: { story: Story }) {
  const c = story.card;
  return (
    <Link
      to={`/historias/${story.slug}`}
      className={`relative flex h-full w-full flex-col items-center justify-start gap-6 overflow-clip rounded-xl bg-superficie p-3 no-underline transition-colors after:border after:border-borda hover:after:border-coral ${RING}`}
    >
      <div className="relative flex aspect-[1.66667] w-full flex-none items-center justify-center overflow-clip rounded-lg">
        <div
          className={`absolute top-0 left-0 z-1 size-full overflow-clip rounded-[inherit] after:border after:border-[#1e1e2e0d] ${RING}`}
        >
          <Img
            src={`/img/${c.image.file}`}
            alt={c.image.alt}
            width={c.image.w}
            height={c.image.h}
            sizes="(min-width: 1200px) 588px, (min-width: 744px) 50vw, 90vw"
            className="size-full rounded-[inherit] object-cover object-center"
          />
        </div>
      </div>

      <div className="flex min-h-[200px] w-full flex-none flex-col items-start justify-between overflow-clip px-3 pb-3 lg:min-h-[190px]">
        <h3 className="w-full flex-none font-display text-[22px] leading-[1.2] font-extrabold tracking-[-0.03em] break-words whitespace-pre-wrap text-ink [text-wrap:wrap] md:text-2xl lg:text-[28px] xl:text-[32px]">
          {c.title}
        </h3>

        <div className="relative z-2 flex w-full flex-none items-end justify-start gap-5 overflow-clip lg:gap-10">
          <div className="flex w-px flex-[1_0_0] flex-col items-start gap-1 lg:gap-2">
            {/* Coral no número: é o dado que a história inteira sustenta, o
                mesmo tratamento que os cards da home dão. */}
            <p className="w-full flex-none overflow-clip font-display text-2xl leading-[1.1] font-extrabold tracking-[-0.02em] break-words whitespace-pre-wrap text-coral md:text-[28px] lg:text-[36px]">
              {c.metric}
            </p>
            <p className="w-full flex-none overflow-clip font-display text-[13px] leading-[1.3] font-medium tracking-[-0.02em] break-words whitespace-pre-wrap text-[#1e1e2ed9] md:text-[14px] lg:text-[15px] xl:text-base">
              {c.metricLabel}
            </p>
          </div>

          <div className="flex w-min flex-none items-center justify-center overflow-clip rounded-[1000px] bg-coral-light px-4 py-2">
            <p className="w-auto flex-none font-display text-[15px] leading-[1.3] font-bold tracking-[-0.02em] whitespace-pre text-coral md:text-base lg:text-[17px] lg:leading-[1.4] xl:text-[18px] xl:leading-[1.3]">
              {c.label}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * The pill CTA. Local rather than <Button> because the shared component pins
 * its label at 16px / 49px tall, while the original's `s9koru` preset steps
 * 13/14/15/16 with the box following it. See the report.
 */
export function Pill({
  to,
  tone,
  children,
}: {
  to: string;
  tone: "dark" | "light";
  children: string;
}) {
  return (
    <Link
      to={to}
      className={`relative flex w-min cursor-pointer items-center justify-start gap-2 overflow-clip rounded-[1000px] py-[14px] pr-[14px] pl-4 no-underline ${
        tone === "dark"
          ? "bg-coral text-white shadow-lg shadow-coral/25"
          : "border border-borda bg-superficie text-coral"
      }`}
    >
      <span className="w-auto flex-none font-display text-[13px] leading-[1.3] font-bold tracking-[-0.02em] whitespace-pre md:text-[14px] lg:text-[15px] xl:text-base">
        {children}
      </span>
      {/* 12x12 in a 24-unit viewBox; the path is the original's own chevron
          symbol, 7.5x15 units starting at (9, 4.5). */}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="block aspect-square shrink-0"
      >
        <path
          d="M 9 4.5 L 16.5 12 L 9 19.5"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Link>
  );
}
