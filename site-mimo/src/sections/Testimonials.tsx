import type { CSSProperties } from "react";
import { AnimatedText } from "../components/AnimatedText";
import { Img } from "../components/Img";
import { useInView } from "../hooks/useInView";

/*
 * Every number here was read from the original, never chosen:
 *   - layout      -> all.css, rules .framer-1op4a3q / az7oa2 / 1yr1hav /
 *                    qqb139 / 1hegdo9 / vy750w / 1r8ns2y and friends
 *   - marquee     -> the Ticker props in the page bundle:
 *                    { speed: 50, gap: 8, hoverFactor: 0, fadeWidth: 0,
 *                      direction: "right" } for the top row and
 *                    direction "left" for the bottom one
 *   - reveal      -> transition { delay .2s, duration .5s, ease [.6,0,.4,1] },
 *                    enter { opacity 0, y 10 }, targetOpacity .8
 *
 * Type presets have FOUR tiers, so `xl:` carries the >=1440 values:
 *   heading (dpkcyd) 39 / 44 / 56 / 64, lh 1.05em, -.04/-.04/-.03/-.04em
 *   body    (z9blpo) 15 / 17 / 19 / 20, lh 1.3/1.3/1.4/1.3em, -.03em
 *   quote  (168zpc5) 15 / 16 / 17 / 18, lh 1.3/1.3/1.4/1.3em, -.02em
 *   eyebrow (ckayli) 12 / 13 / 14 / 14, lh 1.3em, uppercase
 *   role   (1cz70xf) 10 / 11 / 12 / 12, lh 1.3em, uppercase
 *
 * MEDIR: as fotos continuam sendo as do template — rostos que não são os das
 * pessoas citadas. Como as imagens ficam por ora, os retratos entram como
 * decorativos (`alt=""`) em vez de descreverem alguém que não está ali; quem
 * carrega nome e negócio é a legenda de texto ao lado.
 */

const EASE = "cubic-bezier(0.6, 0, 0.4, 1)";
const REVEAL_MS = 500;

/** Ticker geometry: fixed 335x275 cards, 8px apart, at 50px/s. */
const CARD_W = 335;
const GAP = 8;
const SPEED = 50;

/** Content Wrapper mask — feathers both rows at once, not each ticker. */
const MASK =
  "linear-gradient(90deg, rgba(0,0,0,0) 2.7871621621621623%, rgb(0,0,0) 26%, rgb(0,0,0) 51.30736204954955%, rgb(0,0,0) 74%, rgba(0,0,0,0) 94.93067286036036%)";

type Testimonial = {
  file: string;
  w: number;
  h: number;
  quote: string;
  name: string;
  role: string;
};

/** DOM order in the original: the top row runs card 4 -> 1. */
const TOP_ROW: Testimonial[] = [
  {
    file: "2mfcxFDDCihs8qMyJ6EGSuK5ic.png",
    w: 271,
    h: 271,
    quote:
      "“Antes eu não sabia se estava dando lucro. Hoje a Mimu me manda um resumo todo dia, e isso mudou como eu penso o salão.”",
    name: "Andréia",
    role: "Salão da Andréia",
  },
  {
    file: "pYtkUV6ylecSqUTD6mjXWg6GJw.png",
    w: 270,
    h: 270,
    quote:
      "“Eu anotava tudo num caderno que vivia molhado no balcão. Agora falo com a Mimu entre um cliente e outro e pronto, tá lançado.”",
    name: "Marcos",
    role: "Barbearia do Marcos",
  },
  {
    file: "ORZ2OZUEQ2as3jEkHNgezn4rYM.png",
    w: 270,
    h: 270,
    quote:
      "“O que mais me ajudou foi ver quanto ainda vai entrar no dia. Consigo decidir se compro material hoje ou espero.”",
    name: "Juliana",
    role: "Lanchonete da Ju",
  },
  {
    file: "9recIF4fkRJ9pFlPX74y7IHnRd4.png",
    w: 270,
    h: 270,
    quote:
      "“Minha filha tentou me ensinar planilha três vezes. Com a Mimu eu aprendi sozinha no primeiro dia, porque é só conversar.”",
    name: "Cleide",
    role: "Salão Beleza Pura",
  },
];

const BOTTOM_ROW: Testimonial[] = [
  {
    file: "30CFXUnCk8STcw46pYUO2uxJ0.png",
    w: 270,
    h: 270,
    quote:
      "“Uso para controlar fiado e estoque no mesmo lugar. A Mimu lembra quem me deve antes de eu esquecer.”",
    name: "Rodrigo",
    role: "Mercadinho do Rodrigo",
  },
  {
    file: "8d05ZYSGzRhylsMyJawQcE6Sw2o.png",
    w: 270,
    h: 270,
    quote:
      "“Recomendo para toda amiga que também trabalha por conta. É simples, e parece que fizeram pensando em mim.”",
    name: "Carol",
    role: "Manicure da Carol",
  },
  {
    file: "2ANM3E8gLWnuM9ksYJkwGuFH0s.jpg",
    w: 783,
    h: 791,
    quote:
      "“No fim do mês eu levava um domingo inteiro para fechar as contas. Agora abro o app e já está fechado.”",
    name: "Patrícia",
    role: "Doces da Pati",
  },
  {
    file: "wnEMLIn6ABgtAMHCO0AOYDc90.png",
    w: 271,
    h: 271,
    quote:
      "“Aqui a internet cai direto. A Mimu continua funcionando e depois sincroniza sozinha — nunca perdi um lançamento.”",
    name: "Tiago",
    role: "Barbearia Navalha",
  },
  {
    file: "gQ1NaBKbsRn3UTtYc81AcZxRuo.png",
    w: 271,
    h: 271,
    quote:
      "“Trinta e nove reais por mês é o preço de duas cervejas. Só de parar de esquecer cobrança já se paga.”",
    name: "Wesley",
    role: "Mercadinho Bom Preço",
  },
];

export function Testimonials() {
  return (
    <section
      id="depoimentos"
      className="flex w-full flex-col items-center overflow-clip bg-cream py-10 lg:py-15"
    >
      <div className="container-page flex flex-col items-center gap-10 overflow-clip md:overflow-visible lg:gap-15 lg:overflow-clip">
        {/* Title Wrapper: 20px apart on desktop, 16px below 1200. */}
        <div className="flex w-full flex-col items-center gap-4 lg:gap-5">
          <div className="flex w-min items-center gap-2.5">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-[100px] bg-coral"
            />
            <p className="font-display text-xs leading-[1.3] font-bold tracking-[0.1em] whitespace-pre text-coral uppercase md:text-[13px] lg:text-sm">
              Depoimentos
            </p>
          </div>

          <AnimatedText
            text={"Quem já usa,\nnão volta pro caderno."}
            className="w-full max-w-[650px] text-center font-display text-[39px] leading-[1.05] font-extrabold tracking-[-0.04em] text-ink md:w-[90%] md:max-w-[850px] md:text-[44px] lg:w-4/5 lg:text-[56px] lg:tracking-[-0.03em] xl:text-[64px] xl:tracking-[-0.04em]"
          />

          <Paragraph />
        </div>

        {/* Content Wrapper: the two rows, 8px apart, masked as one block. */}
        <div
          className="flex w-full flex-col items-start gap-2 overflow-clip"
          style={{ maskImage: MASK, WebkitMaskImage: MASK }}
        >
          {/* The Ticker fills its viewport by repeating the set: 4 passes on
              the top row, 3 on the bottom — 16 and 15 cards, as measured. */}
          <Row cards={TOP_ROW} copies={4} toTheRight />
          <Row cards={BOTTOM_ROW} copies={3} />
        </div>
      </div>
    </section>
  );
}

/** Fades to 0.8 — not 1 — because the wrapper carries `opacity: .8`. */
function Paragraph() {
  const { ref, inView } = useInView<HTMLParagraphElement>();

  return (
    <p
      ref={ref}
      className="w-4/5 max-w-[550px] text-center font-display text-[15px] leading-[1.4] font-medium tracking-[-0.03em] text-ink md:max-w-[650px] md:text-[17px] lg:w-3/5 lg:text-[19px] xl:text-xl"
      style={{
        opacity: inView ? 0.8 : 0,
        transform: inView ? "none" : "translateY(10px)",
        transition: `opacity ${REVEAL_MS}ms ${EASE} 200ms, transform ${REVEAL_MS}ms ${EASE} 200ms`,
        willChange: "transform",
      }}
    >
      Mais de 400 negócios de bairro já deixaram o caderno de lado.
    </p>
  );
}

/**
 * One marquee row. The 8px separator is a right margin rather than a flex gap
 * so every slot is exactly 343px: that makes the loop distance an exact
 * fraction of the track (1/copies) and the wrap lands on an identical frame.
 * `hoverFactor: 0` in the original means the row stops under the pointer.
 */
function Row({
  cards,
  copies,
  toTheRight = false,
}: {
  cards: Testimonial[];
  copies: number;
  toTheRight?: boolean;
}) {
  const seconds = (cards.length * (CARD_W + GAP)) / SPEED;

  return (
    <div className="relative h-[275px] w-full flex-none">
      <div className="flex size-full items-center overflow-hidden">
        {/* flex-none matters: as a flex child a w-max track would shrink back
            to the viewport, and the -1/copies shift would come up short. */}
        <ul
          className="relative flex h-full w-max flex-none items-center hover:[animation-play-state:paused]"
          style={
            {
              animationName: "marquee-set",
              animationDuration: `${seconds}s`,
              animationTimingFunction: "linear",
              animationIterationCount: "infinite",
              // Reversing the same keyframe is what `direction: "right"` does.
              animationDirection: toTheRight ? "reverse" : "normal",
              "--marquee-shift": `-${100 / copies}%`,
            } as CSSProperties
          }
        >
          {Array.from({ length: copies }, (_, pass) =>
            cards.map((card) => (
              <li
                key={`${pass}-${card.name}`}
                // Only the first pass is real content; the rest are clones.
                aria-hidden={pass > 0 || undefined}
                className="mr-2 h-[275px] w-[335px] flex-none"
              >
                <Card {...card} />
              </li>
            )),
          )}
        </ul>
      </div>
    </div>
  );
}

function Card({ file, w, h, quote, name, role }: Testimonial) {
  return (
    <figure className="relative flex size-full flex-col items-center justify-between rounded-xl border border-borda bg-superficie p-6">
      <blockquote className="w-full font-display text-[15px] leading-[1.4] font-medium tracking-[-0.02em] text-ink md:text-base lg:text-[17px] xl:text-lg">
        {quote}
      </blockquote>

      <figcaption className="flex w-full items-end gap-3 overflow-clip">
        <span className="relative size-[51px] flex-none overflow-clip rounded-[100px]">
          <Img
            src={`/img/${file}`}
            alt=""
            width={w}
            height={h}
            sizes="51px"
            className="size-full object-cover"
          />
        </span>

        <span className="flex w-px flex-[1_0_0] flex-col items-start justify-end gap-0.5 overflow-clip">
          <span className="w-full font-display text-[15px] leading-[1.3] font-bold tracking-[-0.03em] text-ink md:text-[17px] lg:text-[19px] xl:text-xl">
            {name}
          </span>
          <span className="w-full font-display text-[10px] leading-[1.3] font-bold tracking-[0.06em] text-muted uppercase md:text-[11px] lg:text-xs">
            {role}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
