import type { ReactNode } from "react";
import { Img } from "../components/Img";
import { SectionHeading } from "../components/SectionHeading";
import { useInView } from "../hooks/useInView";

const PATTERN = "/img/Jmgrh5qRTxPjX33edcBsgY4lJA.png";

/*
 * Motion, read from the page bundle — never chosen. Each card graphic is a
 * `p(Fo, { __framer__animate: { transition: <T> }, __framer__enter: <E>,
 * __framer__animateOnce: true, __framer__threshold: 0, __targetOpacity: 1 })`
 * in GgOH7MvrLcmg6aghwwshnMILpGKUM2zvTbpDsSbsW40.BRC7PLEe.mjs. The two enter
 * states and the five transitions it references are declared together at ~208k:
 *   _s = { opacity: 0, x: 0, y: 10 }        ys = { opacity: 0, x: 0, y: 20 }
 *   ns/os/vs/cs/ds = delay .1/.2/.3/.4/.5, duration .5, ease [.6,0,.4,1], tween
 * so every reveal here is the same 500ms tween and only delay/offset differ.
 */
const REVEAL_MS = 500;
const EASE = "cubic-bezier(0.6, 0, 0.4, 1)";

export function Features() {
  return (
    <section id="produto" className="bg-ink py-20 md:py-24 lg:py-30">
      <div className="container-page flex flex-col gap-12 md:gap-16 lg:gap-20">
        <SectionHeading
          tone="dark"
          eyebrow="Produto"
          heading={"Tudo o que você precisa.\nNada que você não usa."}
          paragraph="Feito para quem atende o dia inteiro e não tem tempo de aprender sistema."
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AssistenteMimu />
          <FaturamentoPrevisto />
          <ClientesFieis />
          <ChegaDePlanilha />
        </div>
      </div>
    </section>
  );
}

/**
 * Dot tile under each card's content. Every number here is measured, not chosen:
 * the tile repeats at a fixed 780px, the layer sits at 13% opacity, and a radial
 * mask peaking at 0.4 alpha fades it out toward the edges — so the strongest
 * point on screen is ~5%, not 13%.
 */
function BgPattern({
  className = "",
  maskStart = "0%",
}: {
  className?: string;
  maskStart?: string;
}) {
  const mask = `radial-gradient(60% 60%, rgba(0, 0, 0, 0.4) ${maskStart}, rgba(0, 0, 0, 0) 100%)`;
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute opacity-13 ${className}`}
      style={{
        backgroundImage: `url(${PATTERN})`,
        backgroundSize: "780px",
        backgroundRepeat: "repeat",
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}

/**
 * Fade + slide on first sight, the shape Framer's `styleAppearEffect` renders:
 * the element ships at `opacity: 0` with the offset applied and tweens to rest.
 * It carries the positioning classes so the graphic it wraps keeps the exact
 * box it had before — in the original the animated node IS the widget wrapper.
 */
function Reveal({
  delay,
  offset,
  className = "",
  children,
}: {
  delay: number;
  offset: string;
  className?: string;
  children: ReactNode;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "none" : offset,
        transition: `opacity ${REVEAL_MS}ms ${EASE} ${delay}ms, transform ${REVEAL_MS}ms ${EASE} ${delay}ms`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

function CardText({
  title,
  body,
  className = "",
}: {
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-3 px-9 pt-9 pb-5 ${className}`}>
      <h3 className="max-w-[460px] font-display text-[28px] leading-[1.2] font-extrabold tracking-[-0.84px] text-cream lg:text-[32px] lg:leading-[38.4px] lg:tracking-[-0.96px]">
        {title}
      </h3>
      <p className="max-w-[460px] font-display text-base leading-[1.4] font-medium tracking-[-0.32px] text-[rgba(247,246,243,0.7)] lg:text-xl lg:leading-[28px] lg:tracking-[-0.4px]">
        {body}
      </p>
    </div>
  );
}

/**
 * Card alto da esquerda: foto de fundo, véu escuro e o celular subindo do chão.
 * É o card da assistente — a promessa central da marca —, então fica no espaço
 * mais alto da grade.
 */
function AssistenteMimu() {
  return (
    <article className="relative isolate flex flex-col overflow-clip rounded-xl bg-ink-soft lg:row-span-2 lg:aspect-[592/847]">
      <Img
        src="/img/t0lBfK2WrmNH2l9nOjLOyV5cxE.jpg"
        alt=""
        width={592}
        height={847}
        className="absolute inset-0 -z-10 size-full rounded-xl object-cover"
      />
      {/* Scrim keeps the copy legible: solid at the top, gone by the floor.
          Escuro da marca (#1E1E2E) no lugar do preto do template. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(rgb(30, 30, 46) -30%, rgba(30, 30, 46, 0) 100%)",
        }}
      />

      <CardText
        title="A Mimu registra enquanto você atende"
        body="Fala comigo como fala com uma amiga: “vendi uma escova por 120”. Eu entendo, confirmo e organizo tudo, sem formulário e sem menu."
      />

      <div className="mt-auto flex justify-center pt-8">
        {/* `Mobile Wrapper` (framer-1g1gafq): enter _s, transition ns. */}
        <Reveal
          delay={100}
          offset="translateY(10px)"
          className="w-[58.32%] rounded-t-[36px] bg-bg/10 px-3 pt-3 backdrop-blur-[5px]"
        >
          <Img
            src="/img/UypTyFi4R5nXmDWJYptb9WAPy8c.jpg"
            alt="Conversa com a Mimu registrando uma venda pelo celular"
            width={321}
            height={543}
            className="w-full rounded-t-[32px] object-cover"
          />
        </Reveal>
      </div>
    </article>
  );
}

/** Widgets pinned by percentage, matching the original's absolute placement. */
function FaturamentoPrevisto() {
  return (
    <article className="relative isolate flex flex-col overflow-clip rounded-xl bg-ink-soft lg:aspect-[592/415]">
      <BgPattern className="top-[-1.93%] left-[-1.18%] h-[104.09%] w-[102.53%]" />
      <CardText
        title="Sabe quanto vai entrar antes de entrar"
        body="A Mimu cruza sua agenda com seu histórico e separa o que já é certo do que ainda é previsão."
      />

      <div className="relative min-h-[200px] grow lg:min-h-0">
        {/* `Widget 1` (framer-jmei83): enter _s, transition vs. */}
        <Reveal
          delay={300}
          offset="translateY(10px)"
          className="absolute top-[20%] left-[12%] w-[28%]"
        >
          <Img
            src="/img/y65cLRRGHJZ4vezmyyyw5CksgE.png"
            alt=""
            width={166}
            height={100}
            className="w-full rounded-md"
          />
        </Reveal>
        {/* `Widget 2` (framer-1aheyyr): enter ys, transition ds. */}
        <Reveal
          delay={500}
          offset="translateY(20px)"
          className="absolute top-0 left-[47.5%] w-[39%]"
        >
          <Img
            src="/img/RqWieFwHqlBXiGIfXXmedBGcUG0.png"
            alt=""
            width={231}
            height={201}
            className="w-full rounded-md"
          />
        </Reveal>
        <Overlay className="h-[72px]" />
      </div>
    </article>
  );
}

/** Same shell, but the widgets stack centred in flow rather than absolutely. */
function ClientesFieis() {
  return (
    <article className="relative isolate flex flex-col overflow-clip rounded-xl bg-ink-soft lg:aspect-[592/415]">
      <BgPattern className="top-[-1.93%] left-[-1.18%] h-[104.09%] w-[102.53%]" />
      <CardText
        title="Reconhece quem sempre volta"
        body="A Mimu identifica sozinha seus clientes mais fiéis, para você tratar cada um do jeito que ele merece."
      />

      <div className="relative flex min-h-[200px] grow flex-col items-center gap-3 pb-5 lg:min-h-0">
        {/* `Widget 1` (framer-ta0ov): enter _s, transition vs. */}
        <Reveal delay={300} offset="translateY(10px)" className="w-[48%]">
          <Img
            src="/img/BQ9KdfWsFBYyoflMw2zZtpkmgyw.png"
            alt=""
            width={284}
            height={61}
            className="w-full rounded-md"
          />
        </Reveal>
        {/* `Widget 2` (framer-l73dzc): enter _s, transition ds. */}
        <Reveal delay={500} offset="translateY(10px)" className="w-[57%]">
          <Img
            src="/img/8DQiEUcrNJEwtuoLGeNlBf4mPk.png"
            alt=""
            width={337}
            height={118}
            className="w-full rounded-md"
          />
        </Reveal>
        <Overlay className="h-[86px]" />
      </div>
    </article>
  );
}

/**
 * Full-width card: copy on the left, screenshot with two floating widgets right.
 * The 1148px content box is 412 text + 24 gap + 712 visual. Sizing the visual by
 * percentage would measure against the padded box rather than the card.
 */
function ChegaDePlanilha() {
  return (
    <article className="relative isolate flex flex-col gap-6 overflow-clip rounded-xl bg-ink-soft p-4 pl-9 lg:col-span-2 lg:aspect-[1200/559] lg:flex-row lg:items-center">
      <BgPattern
        className="top-[5.3%] left-[5%] h-[89.4%] w-[90%]"
        maskStart="28.09%"
      />

      <div className="flex flex-col gap-3 lg:w-[412px] lg:shrink-0">
        <h3 className="font-display text-[28px] leading-[1.2] font-extrabold tracking-[-0.84px] text-cream lg:text-[32px] lg:leading-[38.4px] lg:tracking-[-0.96px]">
          Fecha essa planilha
        </h3>
        <p className="max-w-[412px] font-display text-base leading-[1.4] font-medium tracking-[-0.32px] text-[rgba(247,246,243,0.7)] lg:text-xl lg:leading-[28px] lg:tracking-[-0.4px]">
          Você não deveria precisar de fórmula para saber quanto faturou hoje.
          Com a Mimu, você fala. Ela anota.
        </p>
      </div>

      {/* The box is 527px tall and the art is cropped into it. Letting the
          file's natural ratio drive the height renders it at 422 and off-scale. */}
      <div className="relative aspect-[712/527] overflow-clip rounded-xl lg:aspect-auto lg:h-full lg:min-w-0 lg:flex-1">
        <Img
          src="/img/VX70ESppP7X8NVel3gq09PoyNiw.jpg"
          alt=""
          width={712}
          height={527}
          className="absolute inset-0 size-full rounded-xl object-cover"
        />
        {/* `Widget 1` (framer-1x2hnxh): enter _s, transition ns. */}
        <Reveal
          delay={100}
          offset="translateY(10px)"
          className="absolute top-[12.7%] left-[25%] w-1/2"
        >
          <Img
            src="/img/GhVgGIzO855dkHWEGtQagY6C4c.png"
            alt=""
            width={356}
            height={61}
            className="w-full rounded-md"
          />
        </Reveal>
        {/* Blurred tray the panel sits in, `Widget Wrapper`
            (framer-tr1eos): enter ys, transition vs. */}
        <Reveal
          delay={300}
          offset="translateY(20px)"
          className="absolute top-[28.9%] left-[14.5%] w-[70.9%] rounded-xl bg-bg/10 p-2.5 backdrop-blur-[3px]"
        >
          <Img
            src="/img/DnHdVvqxlNDwAbMsCL5JgkcDg.jpg"
            alt="Resumo do faturamento do dia na Mimu"
            width={485}
            height={288}
            className="w-full rounded-[10px] object-cover"
          />
        </Reveal>
      </div>
    </article>
  );
}

/** Fades the graphic into the card floor. */
function Overlay({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 bottom-0 ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(rgba(30, 30, 46, 0) 0%, rgb(42, 42, 61) 100%)",
      }}
    />
  );
}
