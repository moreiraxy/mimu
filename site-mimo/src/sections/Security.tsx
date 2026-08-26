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
/** Curva com leve ultrapassagem — o ícone "chega" com um pop em vez de frear seco. */
const POP = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const CARDS = [
  {
    icon: "xkYpV98WWniejL3UVXpMPZlXo.svg",
    title: "Funciona sem internet",
    body: "Sinal fraco no salão? A Mimu continua anotando. Quando a conexão volta, tudo sobe sozinho.",
    destaque: false,
  },
  {
    icon: "AxRl37zVWRgc5u2LvOQmm2w8Y4.svg",
    title: "Backup automático",
    body: "Seus lançamentos ficam guardados todo dia. Trocou de celular, perdeu o aparelho? Está tudo lá.",
    destaque: false,
  },
  {
    icon: "ft8nMCt6A0x2ZgSm6UJY2FtOvc.svg",
    title: "De acordo com a LGPD",
    body: "Seus dados e os dos seus clientes são tratados conforme a Lei Geral de Proteção de Dados.",
    destaque: false,
  },
  {
    icon: "DEUAbPOnYvcpeBjExgGPpuBzCk.svg",
    title: "Só você vê",
    body: "Ninguém da Mimu abre o seu movimento para olhar. Seus números são seus, e continuam sendo.",
    // Mesma linguagem visual do bento de Features (FeaturesV2.tsx): um card
    // em destaque coral entre os escuros — aqui é o mais "de confiança",
    // privacidade, o que mais pede ênfase.
    destaque: true,
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
    <section id="seguranca" className="w-full bg-bg py-10 lg:py-15">
      <div className="container-page flex flex-col items-center gap-10 lg:gap-15">
        <SectionHeading
          eyebrow="Segurança"
          eyebrowClassName="text-coral"
          heading={"Seus números,\nseguros e sempre com você"}
          paragraph="A Mimu guarda o movimento do seu negócio com backup diário, funciona mesmo sem internet e trata seus dados conforme a LGPD."
        />

        {/* Content Wrapper: cards then the ticker, 40px apart. */}
        <div className="flex w-full max-w-[1280px] flex-col items-center gap-10">
          <div className="grid w-full grid-cols-1 items-start gap-2 md:grid-cols-2">
            {CARDS.map((card, i) => (
              // Todos no mesmo sentido (padrão 1); a sensação de camadas vem
              // só da diferença de força entre os cards.
              <div key={card.title ?? i} className="h-full">
                <Card {...card} />
              </div>
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
  destaque,
}: {
  icon: string;
  title: string;
  body: string;
  destaque: boolean;
}) {
  // Observador no card inteiro (antes ficava no parágrafo, no pé do card, e
  // por isso a animação só disparava quando o final dele já tinha entrado).
  const { ref, inView } = useInView<HTMLElement>();

  return (
    <article
      ref={ref}
      className={`group flex h-[280px] w-full flex-col items-start justify-between gap-6 overflow-clip rounded-2xl p-7 transition-transform duration-300 hover:-translate-y-1 md:h-[320px] ${
        destaque ? "bg-coral" : "border border-white/8 bg-ink-soft"
      }`}
    >
      {/* O ícone entra depois do card, com um leve pop (0.6 → 1) e girando
          de -12°. `useInView` repete, então isso roda toda vez que a seção
          volta pra tela. */}
      <span
        className={`flex size-[68px] shrink-0 items-center justify-center rounded-2xl transition-colors duration-300 ${
          destaque ? "bg-primary-text/10" : "bg-coral/10 group-hover:bg-coral/15"
        }`}
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "scale(1) rotate(0deg)" : "scale(0.6) rotate(-12deg)",
          transition: `opacity 450ms ${POP} 120ms, transform 450ms ${POP} 120ms`,
        }}
      >
        <Img
          src={`/img/${icon}`}
          alt=""
          width={57}
          height={57}
          className={`size-[36px] object-cover transition-transform duration-300 group-hover:scale-110 ${destaque ? "brightness-0" : ""}`}
        />
      </span>

      <div className="flex w-full flex-col items-start gap-3">
        <h3
          className={`w-[90%] font-display text-[26px] leading-[1.2] font-extrabold tracking-[-0.03em] md:text-[30px] ${
            destaque ? "text-primary-text" : "text-cream"
          }`}
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "none" : "translateY(12px)",
            transition: `opacity ${REVEAL_MS}ms ${EASE} 220ms, transform ${REVEAL_MS}ms ${EASE} 220ms`,
          }}
        >
          {title}
        </h3>
        {/* ponytail: one block, not one span per line. `tokenization: line`
            would stagger the second line 75ms behind the first, but Framer
            gets its line boxes from per-character inline-block spans, and
            character-level boxes move the wrap points. Line 1's timing is
            exact; later lines land with it instead of 75ms after. */}
        <p
          className={`w-full font-display text-[14px] leading-[1.4] font-medium tracking-[-0.02em] md:text-base ${
            destaque ? "text-primary-text/70" : "text-cream/70"
          }`}
          style={{
            opacity: inView ? 1 : 0.001,
            transform: inView ? "none" : "translateY(10px)",
            transition: `opacity ${REVEAL_MS}ms ${EASE} 300ms, transform ${REVEAL_MS}ms ${EASE} 300ms`,
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

/** O tique verde antes do rótulo saiu a pedido — sobra só o texto, separado
    pelas barras verticais do `Line`. */
function Chip({ label }: { label: string }) {
  return (
    <span className="flex shrink-0 items-center">
      <p className="font-display text-xs leading-[1.3] font-bold whitespace-pre text-muted-strong md:text-[13px] lg:text-sm">
        {label}
      </p>
    </span>
  );
}
