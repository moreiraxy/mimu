import { Link } from "react-router";
import { AnimatedText } from "../components/AnimatedText";
import { Img } from "../components/Img";
import { useInView } from "../hooks/useInView";

/*
 * Every number below was read from the original, never chosen:
 *   - layout   -> all.css rules .framer-sttaa4 / 1doe8wo / vxyly5 / 1ygwi5m /
 *                 a7ozlr / whgdbr-container / 1qhakv / ben0j5 / 2oqsez / …
 *   - reveal   -> the paragraph and the CTA ship as opacity:0 / translateY(10px)
 *                 in the SSR markup; timing is the site-wide 500ms
 *                 cubic-bezier(.6,0,.4,1) with a 200ms delay.
 *
 * The cards are NOT a carousel: `.framer-whgdbr-container` is `position: sticky;
 * top: 140px` from 744px up, so the four pile on one another as you scroll.
 * Their layout stride is 501px (485 + 16).
 *
 * A logomarca do cliente virou o NOME do negócio em texto: microempreendedor de
 * bairro raramente tem logo, e inventar uma para o site mostraria algo que o
 * próprio cliente não reconheceria como dele.
 */

const EASE = "cubic-bezier(0.6, 0, 0.4, 1)";
const REVEAL_MS = 500;

/** Framer's `data-border` hairline: an inset ::after, so it never resizes the box. */
const RING =
  "after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:content-['']";

type Story = {
  slug: string;
  cover: { file: string; w: number; h: number; alt: string };
  avatar: { file: string; w: number; h: number };
  negocio: string;
  headline: string;
  metric: string;
  metricLabel: string;
  name: string;
  role: string;
  quote: string;
};

const STORIES: Story[] = [
  {
    slug: "salao-da-andreia",
    cover: {
      file: "h9xxBk9etJ2OFU01j1JjbWumg0.jpg",
      w: 1432,
      h: 1053,
      alt: "Vista de um bairro residencial, onde fica o salão da Andréia.",
    },
    avatar: { file: "WXyn7lOXcfhlfB9BfdUN8clhx4.png", w: 498, h: 540 },
    negocio: "Salão da Andréia",
    headline: "Agora eu sei, todo dia, se o salão deu lucro",
    metric: "6 h",
    metricLabel: "por semana que voltaram para o atendimento",
    name: "Andréia",
    role: "Salão da Andréia",
    quote:
      "“Antes eu não sabia se estava dando lucro. Hoje a Mimu me manda um resumo todo dia, e isso mudou como eu penso o salão.”",
  },
  {
    slug: "mercadinho-do-rodrigo",
    cover: {
      file: "zdPkO8CFhqhe4jTGooMuzjKZ8CY.jpg",
      w: 1470,
      h: 1031,
      alt: "Aquarela de um campo verde sob céu suave, fundo da história do mercadinho.",
    },
    avatar: { file: "ZG1ulyOSE6IqRZHtg7SAYqykB1I.png", w: 498, h: 540 },
    negocio: "Mercadinho do Rodrigo",
    headline: "O fiado deixou de sumir no caderno",
    metric: "R$ 940",
    metricLabel: "em fiado esquecido, recuperados no primeiro mês",
    name: "Rodrigo",
    role: "Mercadinho do Rodrigo",
    quote:
      "“Uso para controlar fiado e estoque no mesmo lugar. A Mimu lembra quem me deve antes de eu esquecer.”",
  },
  {
    slug: "manicure-da-carol",
    cover: {
      file: "2fvnLCyk2atQOUd6i938jNVk.jpg",
      w: 964,
      h: 1200,
      alt: "Aquarela da margem de um lago, fundo da história da Carol.",
    },
    avatar: { file: "QsqmBl8epkM6A7UWvnLY3DxB6sY.png", w: 498, h: 540 },
    negocio: "Manicure da Carol",
    headline: "Organizada sem parar de atender nenhuma vez",
    metric: "100%",
    metricLabel: "dos atendimentos registrados na hora, sem anotar depois",
    name: "Carol",
    role: "Manicure da Carol",
    quote:
      "“Recomendo para toda amiga que também trabalha por conta. É simples, e parece que fizeram pensando em mim.”",
  },
  {
    slug: "barbearia-do-marcos",
    cover: {
      file: "yRzvJoJDN6eydgzvXWoibvurhVg.jpg",
      w: 1460,
      h: 1020,
      alt: "Paisagem de montanhas em aquarela, fundo da história da barbearia.",
    },
    avatar: { file: "ipx8j5wOmCg7qnlU6EwXrdHU.png", w: 498, h: 540 },
    negocio: "Barbearia do Marcos",
    headline: "Troquei o caderno molhado do balcão pelo celular",
    metric: "2 min",
    metricLabel: "foi tudo o que levou para configurar no primeiro dia",
    name: "Marcos",
    role: "Barbearia do Marcos",
    quote:
      "“Eu anotava tudo num caderno que vivia molhado no balcão. Agora falo com a Mimu entre um cliente e outro e pronto, tá lançado.”",
  },
];

export function CustomerStories() {
  const { ref, inView } = useInView<HTMLDivElement>();

  /* Paragraph and CTA share one trigger: they sit in the same wrapper and in
     the original enter together, 200ms behind the heading. */
  const reveal = (opacity: number) => ({
    opacity: inView ? opacity : 0,
    transform: inView ? "none" : "translateY(10px)",
    transition: `opacity ${REVEAL_MS}ms ${EASE} 200ms, transform ${REVEAL_MS}ms ${EASE} 200ms`,
    willChange: "transform",
  });

  return (
    <section
      id="historias"
      className="relative flex w-full flex-col items-center overflow-clip bg-bg py-10 lg:py-15"
    >
      <div className="container-page flex flex-col items-center gap-10 lg:gap-15">
        {/* Title Wrapper: centred at every breakpoint, 16px apart below 1200. */}
        <div
          ref={ref}
          className="flex w-full flex-col items-center gap-4 lg:gap-5"
        >
          <div className="flex w-min items-center gap-2.5">
            <span
              aria-hidden="true"
              className="size-2 shrink-0 rounded-[100px] bg-coral"
            />
            <p className="font-display text-xs leading-[1.3] font-bold tracking-[0.1em] whitespace-pre text-coral uppercase md:text-[13px] lg:text-sm">
              Histórias
            </p>
          </div>

          <AnimatedText
            text={"Negócios de verdade,\nresultados de verdade"}
            className="w-full max-w-[650px] text-center font-display text-[39px] leading-[1.05] font-extrabold tracking-[-0.04em] text-ink md:w-[90%] md:max-w-[850px] md:text-[44px] lg:w-4/5 lg:text-[56px] lg:tracking-[-0.03em] xl:text-[64px] xl:tracking-[-0.04em]"
          />

          <p
            className="w-[90%] max-w-[550px] text-center font-display text-[15px] leading-[1.4] font-medium tracking-[-0.03em] text-ink md:w-4/5 md:max-w-[650px] md:text-[17px] lg:w-3/5 lg:text-[19px] xl:text-[20px]"
            style={reveal(0.8)}
          >
            Do salão à lanchonete, veja o que muda no dia a dia de quem passou a
            contar com a Mimu.
          </p>

          <div style={reveal(1)}>
            <Pill to="/historias" tone="dark">
              Ver todas as histórias
            </Pill>
          </div>
        </div>

        {/* The stack. Each card is sticky at 140px from 744px up, so they pile
            on top of each other on scroll; below 744 they just flow. */}
        <ul className="flex w-full flex-col items-start gap-4 md:items-center lg:items-start">
          {STORIES.map((story) => (
            <Card key={story.slug} story={story} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function Card({ story }: { story: Story }) {
  return (
    <li className="relative z-[1] h-auto w-full flex-none md:sticky md:top-[140px] md:aspect-[1.675] md:max-h-[450px] md:max-w-[800px] lg:aspect-auto lg:h-[485px] lg:max-h-none lg:max-w-none">
      <div
        className={`relative flex w-full flex-col items-center gap-5 overflow-clip rounded-lg bg-sand p-3 after:border after:border-[#1e1e2e1a] md:h-full md:flex-row md:gap-0 md:rounded-xl ${RING}`}
      >
        {/* Cover panel. flex 1 against the copy panel's 2, 1.2 on tablet. */}
        <div
          className={`relative flex h-[200px] w-full flex-none flex-col items-center justify-center overflow-clip rounded-lg p-4 after:border after:border-[#1e1e2e0d] md:h-full md:w-px md:flex-[1.2_0_0] lg:flex-[1_0_0] ${RING}`}
        >
          <Img
            src={`/img/${story.cover.file}`}
            alt={story.cover.alt}
            width={story.cover.w}
            height={story.cover.h}
            className="absolute inset-0 size-full rounded-[inherit] object-cover object-center"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 z-0 size-full overflow-clip opacity-80"
            style={{
              background:
                "linear-gradient(180deg, #1e1e2e00 15%, #1e1e2e4d 100%)",
            }}
          />
          {/* O nome do negócio no lugar da logo: branco sobre a foto, no mesmo
              ponto em que a marca do cliente aparecia. */}
          <p className="relative z-[1] text-center font-display text-base leading-[1.2] font-extrabold tracking-[-0.02em] text-white lg:text-lg">
            {story.negocio}
          </p>
        </div>

        {/* Copy panel: row at 1200+, column below. */}
        <div className="relative flex h-auto w-full flex-none flex-col items-center justify-center gap-5 overflow-clip p-0 md:h-full md:w-px md:flex-[2_0_0] md:justify-between md:gap-0 md:px-5 md:py-2 lg:flex-row lg:justify-center lg:gap-7 lg:px-7">
          <div className="relative flex w-full flex-none flex-col items-start justify-center gap-5 overflow-clip md:h-px md:flex-[1_0_0] md:justify-between md:gap-0 md:pb-5 lg:h-full lg:w-px lg:p-0">
            <h3 className="w-full flex-none font-display text-[22px] leading-[1.2] font-extrabold tracking-[-0.03em] break-words text-ink [text-wrap:wrap] md:text-2xl lg:text-[28px] xl:text-[32px]">
              {story.headline}
            </h3>

            <div className="relative z-[2] flex w-full flex-none items-end justify-between overflow-clip">
              <div className="flex w-px flex-[1_0_0] flex-col items-start gap-1.5 pr-5">
                {/* O número é coral: é o dado que a história inteira sustenta. */}
                <p className="w-full flex-none overflow-clip font-display text-[28px] leading-none font-extrabold tracking-[-0.03em] break-words text-coral md:text-[27px] lg:text-[36px] xl:text-[39px]">
                  {story.metric}
                </p>
                <p className="w-full flex-none overflow-clip font-display text-[11px] leading-[1.3] font-medium tracking-[-0.02em] break-words text-[#1e1e2ed9] md:text-xs lg:text-[13px] xl:text-sm">
                  {story.metricLabel}
                </p>
              </div>

              <div className="relative w-auto flex-none">
                <Pill to={`/historias/${story.slug}`} tone="light">
                  Ler história
                </Pill>
              </div>
            </div>
          </div>

          {/* Dashed divider: on the left edge at 1200+, on top below that. */}
          <div
            className={`relative flex w-full flex-none flex-col items-start justify-center gap-4 overflow-clip pt-5 after:border-t after:border-dashed after:border-[#1e1e2e1a] lg:h-full lg:w-px lg:flex-[1_0_0] lg:justify-between lg:gap-0 lg:pt-0 lg:pl-7 lg:after:border-t-0 lg:after:border-l ${RING}`}
          >
            {/* At 744-1199 only, the original gives the quote order 0 and this
                block order 1, so the identity drops below it. */}
            <figure className="flex w-full flex-none items-end justify-center gap-3 md:order-1 lg:order-0 lg:justify-start">
              <span className="relative aspect-[0.923567] w-[13%] flex-none overflow-clip rounded-md md:w-[14%] lg:w-[40%]">
                <Img
                  src={`/img/${story.avatar.file}`}
                  alt=""
                  width={story.avatar.w}
                  height={story.avatar.h}
                  sizes="134px"
                  className="absolute inset-0 size-full rounded-[inherit] object-cover object-center"
                />
              </span>

              <figcaption className="flex w-px flex-[1_0_0] flex-col items-start gap-0.5">
                <p className="w-full flex-none overflow-clip font-display text-[13px] leading-[1.3] font-bold tracking-[-0.02em] break-words text-ink md:text-[14px] lg:text-[15px] xl:text-base">
                  {story.name}
                </p>
                <p className="w-full flex-none overflow-clip font-display text-[11px] leading-[1.3] font-medium tracking-[-0.02em] break-words text-muted md:text-xs lg:text-[13px] xl:text-sm">
                  {story.role}
                </p>
              </figcaption>
            </figure>

            <blockquote className="w-full flex-none font-display text-[13px] leading-[1.4] font-medium tracking-[-0.02em] break-words text-ink md:text-[14px] lg:text-[15px] xl:text-base">
              {story.quote}
            </blockquote>
          </div>
        </div>
      </div>
    </li>
  );
}

/**
 * The pill CTA, local to this section on purpose: <Button> is fixed at 16px /
 * 49px tall, and the original's `s9koru` label steps 13/14/15/16 with the box
 * following it (44.9px tall below 744, 49px at 1440).
 */
function Pill({
  to,
  tone,
  children,
}: {
  to: string;
  tone: "dark" | "light";
  children: string;
}) {
  const dark = tone === "dark";
  return (
    <Link
      to={to}
      className={`relative flex w-min cursor-pointer items-center justify-start gap-2 overflow-clip rounded-[1000px] py-[14px] pr-[14px] pl-4 no-underline ${
        dark
          ? "bg-coral text-white shadow-lg shadow-coral/25"
          : "border border-borda bg-superficie text-coral"
      }`}
    >
      <span className="w-auto flex-none font-display text-[13px] leading-[1.3] font-bold tracking-[-0.02em] whitespace-pre md:text-[14px] lg:text-[15px] xl:text-base">
        {children}
      </span>
      <Chevron />
    </Link>
  );
}

/** 12x12 in a 24-unit viewBox; the path is the original's, 7.5x15 at (9, 4.5). */
function Chevron() {
  return (
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
  );
}
