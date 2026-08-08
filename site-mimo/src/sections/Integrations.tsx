import { AnimatedText } from "../components/AnimatedText";
import { Img } from "../components/Img";
import { MimuIcon } from "../components/Logo";
import { useInView } from "../hooks/useInView";

/*
 * Every number here was read from the original's CSS/JS, never chosen.
 *
 * Type presets (four tiers: <744 / 744-1199 / 1200-1439 / >=1440):
 *   eyebrow  (ckayli) 12 / 13 / 14 / 14, lh 1.3em, uppercase
 *   heading  (dpkcyd) 39 / 44 / 56 / 64, lh 1.05em, -0.04/-0.04/-0.03/-0.04em
 *   body     (z9blpo) 15 / 17 / 19 / 20, lh 1.3/1.3/1.4/1.3em, -0.03em
 *
 * The section is NOT wider than its container: `.framer-150ins3` is the usual
 * 90%/1200px box. What extends past it is the two tickers' clipped overflow —
 * each ticker is `overflow: hidden`, so the logos measured at x -68%..177% are
 * real layout boxes that simply are not painted.
 *
 * ---
 * As duas esteiras mostram os 8 apps que um microempreendedor de bairro
 * já usa hoje pra tentar dar conta disso tudo (WhatsApp, Excel, Sheets,
 * Agenda, Gmail, Notion, Notas, Instagram) — não integrações reais da
 * Mimu, por isso seguem decorativas (`alt=""`). O ícone de Notas não
 * existe como marca no catálogo de ícones usado; renderiza como um
 * bloco de notas genérico em vez do logo da Apple.
 */
const REVEAL_MS = 500;
const EASE = "cubic-bezier(0.6, 0, 0.4, 1)";

/** Ticker geometry. 81px white tile + 6px of tray on each side = 93px cell. */
const CELL = 93;
/** `gap: 20` on the Ticker; carried as a right margin so the loop lands exact. */
const GAP = 20;
/** Framer Ticker `speed: 50` — px/s, not a duration. */
const SPEED = 50;
/**
 * Framer duplicates the slots `round(parent / pass * 2) + 1` times on top of
 * the original, which is 3 + 1 = 4 passes for both rows at every breakpoint
 * here. It then travels `pass * round(parent / pass)` = two passes per
 * cycle, which is exactly the -50% of a four-pass track that
 * `marquee-track` already animates.
 */
const PASSES = 4;

/** `fadeWidth: 25` renders as stops at 25/2 and 100 - 25/2. */
const MASK =
  "linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 1) 12.5%, rgba(0, 0, 0, 1) 87.5%, rgba(0, 0, 0, 0) 100%)";

const PATTERN = "/img/Jmgrh5qRTxPjX33edcBsgY4lJA.png";

type Logo = {
  file: string;
  /** Literal class so Tailwind's scanner emits it. */
  box: string;
  w: number;
  h: number;
};

/** Left ticker — WhatsApp, Excel, Sheets, Agenda — travelling right. */
const ROW_A: Logo[] = [
  { file: "apps/whatsapp.svg", box: "size-[42px]", w: 24, h: 24 },
  { file: "apps/microsoftexcel.svg", box: "size-[42px]", w: 24, h: 24 },
  { file: "apps/googlesheets.svg", box: "size-[42px]", w: 24, h: 24 },
  { file: "apps/googlecalendar.svg", box: "size-[42px]", w: 24, h: 24 },
];

/** Right ticker — Gmail, Notion, Notas, Instagram — travelling left. */
const ROW_B: Logo[] = [
  { file: "apps/gmail.svg", box: "size-[42px]", w: 24, h: 24 },
  { file: "apps/notion.svg", box: "size-[42px]", w: 24, h: 24 },
  { file: "apps/applenotes.svg", box: "size-[42px]", w: 24, h: 24 },
  { file: "apps/instagram.svg", box: "size-[42px]", w: 24, h: 24 },
];

export function Integrations() {
  return (
    <section
      id="integracoes"
      className="relative flex w-full flex-col items-center overflow-clip bg-cream pt-20 pb-15 md:pb-10 lg:py-30"
    >
      <BgPattern />

      {/* Container drops its 60px floor only below 744px. `relative` is
          load-bearing: without it the container paints below the positioned
          pattern layer instead of above it. */}
      <div className="container-page relative flex flex-col items-center gap-10 md:pb-15 lg:gap-15">
        <div className="flex w-full flex-col items-center gap-4 lg:gap-5">
          {/* Eyebrow: 8px dot, 10px away from the uppercase label. */}
          <div className="flex w-min items-center gap-2.5">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-[100px] bg-coral"
            />
            <p className="font-display text-xs leading-[1.3] font-bold tracking-[0.1em] whitespace-pre text-coral uppercase md:text-[13px] lg:text-sm">
              Tudo num lugar só
            </p>
          </div>

          <AnimatedText
            text={"Caderno, planilha ou memória:\na Mimu substitui os três."}
            className="w-full max-w-[650px] text-center font-display text-[39px] leading-[1.05] font-extrabold tracking-[-0.04em] text-ink md:w-[90%] md:max-w-[850px] md:text-[44px] lg:w-4/5 lg:text-[56px] lg:tracking-[-0.03em] xl:text-[64px] xl:tracking-[-0.04em]"
          />

          <Paragraph />
        </div>

        {/* As duas esteiras convergem na marca da Mimu; cada uma pega metade do
            que sobra, e ambas são recortadas nessa metade. */}
        <div className="relative flex w-full flex-row items-center justify-center">
          <Ticker logos={ROW_A} reverse />
          <MarcaCentral />
          <Ticker logos={ROW_B} />
        </div>
      </div>
    </section>
  );
}

/**
 * Dot tile across the whole section. 780px repeat from the top-left, masked by
 * a radial that peaks at 0.4 alpha in the middle — no layer opacity, unlike the
 * Features cards.
 */
function BgPattern() {
  const mask =
    "radial-gradient(60% 60%, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0) 100%)";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        backgroundImage: `url(${PATTERN})`,
        backgroundSize: "780px auto",
        backgroundRepeat: "repeat",
        backgroundPosition: "left top",
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}

/** Settles at opacity .8, not 1 — that is the animation's target in the bundle. */
function Paragraph() {
  const { ref, inView } = useInView<HTMLParagraphElement>();

  return (
    <p
      ref={ref}
      className="w-4/5 max-w-[550px] text-center font-display text-[15px] leading-[1.4] font-medium tracking-[-0.03em] text-ink md:w-[85%] md:max-w-[650px] md:text-[17px] lg:w-3/5 lg:text-[19px] xl:text-xl"
      style={{
        opacity: inView ? 0.8 : 0,
        transform: inView ? "none" : "translateY(10px)",
        transition: `opacity ${REVEAL_MS}ms ${EASE} 200ms, transform ${REVEAL_MS}ms ${EASE} 200ms`,
        willChange: "transform",
      }}
    >
      Você não precisa juntar cinco aplicativos para tocar um negócio de bairro.
      Vendas, agenda, contas e clientes passam a viver no mesmo lugar.
    </p>
  );
}

/**
 * O ladrilho de 190px (120px no mobile) em que as duas esteiras desembocam.
 * Aqui entrava o favicon do Payflow como imagem; agora é a marca desenhada, que
 * fica nítida nos dois tamanhos e dispensa um arquivo.
 */
function MarcaCentral() {
  return (
    <div
      className="relative z-[1] flex shrink-0 items-center justify-center rounded-[18px] bg-[#f7f6f380] p-2 backdrop-blur-[7px] md:rounded-[28px] md:p-3"
      style={{
        boxShadow:
          "0px 2.32px 3px rgba(0, 0, 0, 0.1), 0px 13.94px 6px rgba(0, 0, 0, 0.09), 0px 30.18px 8px rgba(0, 0, 0, 0.05), 0px 51.1px 9px rgba(0, 0, 0, 0.01)",
      }}
    >
      <MimuIcon className="aspect-square w-[120px] rounded-2xl md:w-[190px] md:rounded-3xl" />
    </div>
  );
}

/**
 * Half-width conveyor. `flex: 1 0 0` splits whatever the centre tile leaves,
 * and `overflow: hidden` is what keeps the track from spilling into the
 * neighbouring half — the logos still lay out well past the container.
 */
function Ticker({ logos, reverse = false }: { logos: Logo[]; reverse?: boolean }) {
  const pass = logos.length * (CELL + GAP);
  // One cycle travels two passes; the track is four, hence marquee's -50%.
  const seconds = (2 * pass) / SPEED;

  return (
    <div className="relative w-px min-w-0 flex-[1_0_0] self-stretch">
      <div
        className="flex h-full items-center overflow-hidden p-2.5"
        style={{ maskImage: MASK, WebkitMaskImage: MASK }}
      >
        <ul
          className="marquee-track flex h-full w-max items-center"
          style={{
            animationDuration: `${seconds}s`,
            animationDirection: reverse ? "reverse" : "normal",
          }}
        >
          {Array.from({ length: PASSES }, (_, i) =>
            logos.map((logo) => <Cell key={`${i}-${logo.file}`} logo={logo} />),
          )}
        </ul>
      </div>
    </div>
  );
}

/** Bandeja de vidro em volta de um ladrilho branco, com o fio de contorno no ::after. */
function Cell({ logo }: { logo: Logo }) {
  return (
    <li
      aria-hidden="true"
      className="mr-5 flex shrink-0 flex-col items-center gap-3 rounded-md"
    >
      <div
        className="relative z-[2] flex items-center justify-center overflow-hidden rounded-2xl bg-[#f7f6f380] p-1.5 backdrop-blur-[7px]"
        style={{
          boxShadow:
            "0px 0.98px 3px rgba(0, 0, 0, 0.1), 0px 5.89px 6px rgba(0, 0, 0, 0.09), 0px 12.75px 8px rgba(0, 0, 0, 0.05), 0px 21.59px 9px rgba(0, 0, 0, 0.01), 0px 34.35px 10px rgba(0, 0, 0, 0)",
        }}
      >
        <div className="relative z-[1] flex size-[81px] items-center justify-center rounded-xl bg-superficie backdrop-blur-[7px] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border-[1.1px] after:border-[#1e1e2e0d] after:content-['']">
          <Img
            src={`/img/${logo.file}`}
            alt=""
            width={logo.w}
            height={logo.h}
            className={`${logo.box} object-contain`}
          />
        </div>
      </div>
    </li>
  );
}
