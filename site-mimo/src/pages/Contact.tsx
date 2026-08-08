import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router";
import { Counter } from "../components/Counter";
import { Header } from "../components/Header";
import { Img } from "../components/Img";
import { Footer } from "../sections/Footer";
import { Logos } from "../sections/Logos";
import { useInView } from "../hooks/useInView";

/*
 * /contact — every number below was read from page_contact.html's own inline
 * <style> blocks and from its page bundle
 * (js/tKTBL2ZGvRilL5L3Ngujg9m2eAop4vDkCYjggdqVsro.gr9f1Cb-.mjs), never chosen.
 * This route ships its own CSS: it is NOT the home page's all.css.
 *
 *   layout   -> .framer-1r5yxkd (section) / htzsbb (container) / 1mefysa
 *               (content col) / 1qdhe82 (title) / 1mmnx3 (stats+logos) /
 *               1i138jm (hero visual) / cpoown (form card) / 11ve9cq (form) /
 *               1hb4uo6 (fields) / f1wm3s + ntmesv + 1v9n3gq (testimonials) /
 *               hy88i4 (card, scope .framer-YZo9g) / 16wqgz0 v-cj3kec (stats)
 *   colours  -> the token table, NOT the inline rgb() fallbacks: those claim
 *               #181818 for ink (really #1e1e2e) and rgb(24,24,24) for the
 *               submit button's fill (also #1e1e2e).
 *   inputs   -> the --framer-input-* custom properties on .framer-1nyn97j /
 *               ha29hw / 1eyehn6 / 1sk6q4m, plus the shared .framer-form-*
 *               rules. Every border lives on ::after, never on the box.
 *
 * Type presets, four tiers (<744 / 744-1199 / 1200-1439 / >=1440):
 *   zucctp  (h1)      40 / 52 / 58 / 64, lh 1.1em,  w500, -.03em
 *   z9blpo  (body)    15 / 17 / 19 / 20, lh 1.3/1.3/1.4/1.3em, w500, -.03em
 *   ckayli  (label)   12 / 13 / 14 / 14, lh 1.3em,  w500, 0em, Geist Mono, upper
 *   1cz70xf (stat cap)10 / 11 / 12 / 12, lh 1.3em,  w500, 0em, Geist Mono, upper
 *   s9koru  (button)  13 / 14 / 15 / 16, lh 1.3em,  w500, -.02em
 *   13jwwjk (consent) 11 / 12 / 13 / 14, lh 1.3em,  w500, -.02em
 *   168zpc5 (name)    15 / 16 / 17 / 18, lh 1.3/1.3/1.4/1.3em, w500, -.02em
 *   1xcey7  (role)     9 / 10 / 11 / 12, lh 1.3em,  w600, -.02em
 */

const EASE = "cubic-bezier(0.6, 0, 0.4, 1)";

/** Resolved colour tokens. The rgb() fallbacks next to them in the CSS are stale. */
const INK_85 = "#1e1e2ed9"; // 6dcb094e
const INK_70 = "#1e1e2eb3"; // 5e3117c8
const INK_50 = "#1e1e2e80"; // eec5afa4
const INK_30 = "#1e1e2e4d"; // f5343c22
const FIELD_BG = "#ece9e280"; // ce6b6742 — sand at 50%
const CREAM_70 = "#f7f6f3b3"; // c3ab674d

export default function Contact() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Testimonials />
      </main>
      {/* The original closes the document with <footer> outside the sections. */}
      <Footer />
    </>
  );
}

/** Section padding 100/120/160 top, 40/40/60 bottom; container gap 40/40/60. */
function Hero() {
  return (
    <section className="relative flex w-full flex-col items-center overflow-clip bg-cream pt-25 pb-10 md:pt-30 lg:pt-40 lg:pb-15">
      <div className="container-page flex flex-col items-start justify-center gap-10 overflow-clip md:flex-row lg:gap-15">
        {/* Content column: `flex: 1 0 0` beside the form, stretched to a
            915px floor from 744 up, which is what pins the logo strip to the
            bottom of the card next to it. Below 744 it is a plain 40px stack. */}
        <div className="flex w-full flex-none flex-col items-start justify-start gap-10 overflow-clip md:w-px md:min-h-[915px] md:flex-[1_0_0] md:justify-between md:gap-0 md:self-stretch">
          <div className="flex w-full flex-none flex-col items-center gap-5 overflow-clip md:items-start">
            <Heading />
            <Paragraph />
          </div>

          <div className="flex w-full flex-none flex-col items-start gap-10 overflow-clip">
            <HeroVisual />
            {/*
              The original renders the same "Black" logo component here that the
              home page's hero uses (.framer-Bbqzr.framer-je3bbi), so this is the
              shared section rather than a second copy of it.
            */}
            <Logos />
          </div>
        </div>

        <FormCard />
      </div>
    </section>
  );
}

/**
 * Text effect `It` from the page bundle: tokenization `line`, startDelay 0 —
 * so every token shares one transition and the whole heading reveals as a
 * block. Effect { opacity .001, blur 3px, y 10 }, tween 500ms on the shared
 * ease after 200ms, threshold 1, repeat false.
 *
 * <AnimatedText> is deliberately not used: it plays a per-word translateY(100%)
 * wipe, which is a different effect from the one this page configures.
 */
function Heading() {
  const { ref, inView } = useInView<HTMLHeadingElement>();

  return (
    <h1
      ref={ref}
      className="w-full max-w-[650px] text-center font-display text-[40px] leading-[1.1] font-medium tracking-[-0.03em] text-ink will-change-transform md:max-w-none md:text-left md:text-[52px] lg:text-[58px] xl:text-[64px]"
      style={{
        opacity: inView ? 1 : 0.001,
        filter: inView ? "blur(0px)" : "blur(3px)",
        transform: inView ? "translateY(0)" : "translateY(10px)",
        transition: `opacity 500ms ${EASE} 200ms, filter 500ms ${EASE} 200ms, transform 500ms ${EASE} 200ms`,
      }}
    >
      Vamos começar o seu teste grátis
    </h1>
  );
}

/**
 * Appear animation `17fmi7c` from __framer__appearAnimationsContent: identical
 * on all three breakpoints — { opacity .001, y 10 } tweening 500ms on the
 * shared ease after 400ms.
 */
function Paragraph() {
  const { ref, inView } = useInView<HTMLParagraphElement>();

  return (
    <p
      ref={ref}
      className="w-4/5 max-w-[550px] text-center font-display text-[15px] leading-[1.3] font-medium tracking-[-0.03em] will-change-transform md:w-full md:max-w-none md:text-left md:text-[17px] lg:text-[19px] lg:leading-[1.4] xl:text-[20px] xl:leading-[1.3]"
      style={{
        color: INK_85,
        opacity: inView ? 1 : 0.001,
        transform: inView ? "translateY(0)" : "translateY(10px)",
        transition: `opacity 500ms ${EASE} 400ms, transform 500ms ${EASE} 400ms`,
      }}
    >
      São 7 dias com tudo liberado e sem cartão de crédito. Conta pra gente do
      seu negócio que a Mimu já chega configurada do seu jeito.
    </p>
  );
}

/** `end` / `prefix` / `suffix` on the three Counter instances in the bundle. */
const HERO_STATS: { prefix?: string; value: string; suffix: string; label: string }[] = [
  { value: "7", suffix: " dias", label: "grátis para testar" },
  { value: "2", suffix: " min", label: "para configurar" },
  { prefix: "+", value: "400", suffix: "", label: "negócios de bairro" },
];

/**
 * `Visual Hero 2`. Fixed 380px tall at 1200+; below that it is driven by a
 * ratio with a cap — 0.857143 / max 400 on tablet, 0.93232 / max 370 on mobile.
 * The stat strip is 125px tall and sits on the floor of the 12px padding box.
 * Only 1200+ renders the third stat (`C8LZOrcfM` is false on both smaller
 * breakpoint overrides).
 */
function HeroVisual() {
  return (
    <div className="relative flex aspect-[0.93232] max-h-[370px] w-full flex-none flex-row items-end justify-center gap-2 overflow-clip rounded-xl p-3 md:aspect-[0.857143] md:max-h-[400px] lg:aspect-auto lg:h-[380px] lg:max-h-none">
      <Img
        src="/img/AeRcUuogo8PqQ4xMEzB8fSQo3c.jpg"
        alt="Pintura em aquarela de colinas com neblina e pinheiros sob um céu nublado."
        width={4297}
        height={3159}
        priority
        className="absolute inset-0 size-full rounded-xl object-cover object-[center_bottom]"
      />

      <div className="relative flex h-[125px] w-px flex-[1_0_0] flex-row items-center justify-start gap-2 overflow-clip">
        {HERO_STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex h-full w-px flex-[1_0_0] flex-col items-start justify-between overflow-clip rounded-lg p-3 ${
              i === 2 ? "hidden lg:flex" : ""
            }`}
            style={{
              backgroundColor: INK_30,
              backdropFilter: "blur(5px)",
              WebkitBackdropFilter: "blur(5px)",
            }}
          >
            <div className="flex h-px w-[95%] flex-[1_0_0] flex-col items-start justify-between">
              <Counter
                prefix={stat.prefix}
                value={stat.value}
                suffix={stat.suffix}
                className="font-display text-[32px] leading-[1em] font-medium tracking-[-0.04em] text-cream"
              />
              <p
                className="w-full font-mono text-[10px] leading-[1.3] font-medium uppercase md:text-[11px] lg:text-[12px]"
                style={{ color: CREAM_70 }}
              >
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ form */

/* Os dois selects deixaram de perguntar coisa de empresa ("team size",
   "enterprise plan") e passaram a perguntar o que a Mimu realmente precisa
   saber para deixar o app pronto: qual é o negócio e de quantas pessoas. */
const TAMANHOS = ["Só eu", "2 a 3 pessoas", "4 a 10 pessoas", "Mais de 10"];
const NEGOCIOS = [
  "Salão de beleza",
  "Barbearia",
  "Manicure ou autônoma",
  "Mercadinho",
  "Lanchonete",
  "Outro",
];

/**
 * Shared by the wrapper of every field. The hairline is a ::after ring — the
 * original never puts a border on the box itself — so the 12px padding still
 * measures from the outer edge, and focus only swaps the ring's colour.
 */
const FIELD_SHELL =
  "relative w-full overflow-hidden rounded-md after:pointer-events-none after:absolute after:inset-0 after:rounded-md after:border after:border-[#1e1e2e0d] after:content-[''] focus-within:after:border-[#0099ff]";

/** 18px/400/1.2em at 0 tracking — the input preset, not any of the text ones. */
const FIELD_TEXT =
  "w-full bg-transparent font-display text-[18px] leading-[1.2em] font-normal tracking-[0em] text-ink outline-none";

const FIELD_STYLE: CSSProperties = { backgroundColor: FIELD_BG };

/**
 * Framer's chevron for `.framer-form-select-wrapper:before`, drawn at 16px and
 * inset 12px from the right edge. Its colour is --framer-input-icon-color,
 * which this page sets to the 50% ink token.
 */
const SELECT_CHEVRON =
  `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">` +
  `<path d="M 3.5 6 L 8 10.5 L 12.5 6" fill="transparent" stroke-width="1.5" stroke="%231e1e2e80" stroke-linecap="round" stroke-linejoin="round"/></svg>')`;

/**
 * Framer overrides the checkbox tick with a hosted PNG that never made it into
 * public/img, so this is Framer's own documented fallback glyph from the
 * page's CSS, recoloured to the icon token this page sets (full ink).
 * MEDIR: the real mark is `ZSnGhibGDRgS9GpCqbnbD0Qe1q0.png` — the same asset
 * the Footer's checkbox is still waiting on.
 */
const TICK_MASK =
  'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M 4 8 L 6.5 10.5 L 11.5 5.5" fill="transparent" stroke-width="2" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>\')';

/** White card, 12px radius, 10% hairline, 36px of padding (24px below 744). */
function FormCard() {
  // Template: there is no endpoint behind this form, so the submit is
  // swallowed. Field-level validation (type + required) is untouched, so the
  // browser still refuses to "send" an incomplete or malformed entry.
  const [sent, setSent] = useState(false);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="relative flex w-full flex-none flex-col items-center justify-center overflow-clip rounded-xl bg-white p-6 after:pointer-events-none after:absolute after:inset-0 after:rounded-xl after:border after:border-[#1e1e2e1a] after:content-[''] md:w-px md:flex-[1_0_0] md:flex-row md:p-9">
      <form
        onSubmit={onSubmit}
        className="flex w-full flex-none flex-col items-start justify-start gap-10 overflow-hidden md:w-px md:flex-[1_0_0]"
      >
        <div className="flex w-full flex-none flex-col items-center justify-center gap-7 overflow-clip">
          <Field label="Seu nome">
            <TextInput
              type="text"
              name="Nome"
              placeholder="Andréia Souza"
              autoComplete="name"
            />
          </Field>

          <Field label="Seu e-mail">
            <TextInput
              type="email"
              name="Email"
              placeholder="voce@email.com"
              autoComplete="email"
            />
          </Field>

          <Field label="Nome do seu negócio">
            <TextInput
              type="text"
              name="Negocio"
              placeholder="Salão da Andréia"
              autoComplete="organization"
            />
          </Field>

          <Field label="Que tipo de negócio é?">
            <Select name="Tipo" options={NEGOCIOS} />
          </Field>

          <Field label="Quantas pessoas trabalham com você?">
            <Select name="Tamanho" options={TAMANHOS} />
          </Field>

          <Field label="Quer contar mais alguma coisa?">
            {/* height auto with a 100px floor, padding on the textarea itself
                (`.framer-form-textarea-input-type` zeroes the wrapper's). */}
            <div className={FIELD_SHELL} style={FIELD_STYLE}>
              <textarea
                name="Mensagem"
                placeholder="Como você controla o seu movimento hoje? (opcional)"
                rows={3}
                className={`${FIELD_TEXT} block min-h-[100px] resize-y p-3 placeholder:text-[#1e1e2e4d]`}
              />
            </div>
          </Field>

          <label className="flex w-full flex-none flex-row items-start gap-3">
            {/* 25px, r4, sand-50, no hairline — the tick is a masked ::before
                revealed by :checked, which is how the original builds it. */}
            <input
              type="checkbox"
              name="Newsletter"
              required
              className="relative size-[25px] shrink-0 appearance-none overflow-hidden rounded-[4px] before:absolute before:inset-0 before:bg-ink before:opacity-0 before:transition-opacity before:content-[''] before:[mask-image:var(--tick)] before:[mask-position:50%] before:[mask-repeat:no-repeat] before:[mask-size:contain] checked:before:opacity-100"
              style={{
                backgroundColor: FIELD_BG,
                ["--tick" as string]: TICK_MASK,
              }}
            />
            <span className="w-px flex-[1_0_0] font-display text-[11px] leading-[1.3] font-medium tracking-[-0.02em] text-ink select-none md:text-[12px] lg:text-[13px] xl:text-[14px]">
              Seus dados ficam com a gente e não são repassados a ninguém. Ao
              enviar, você concorda com os{" "}
              <LegalLink to="/legal/termos">Termos de Uso</LegalLink> e a{" "}
              <LegalLink to="/legal/privacidade">Política de Privacidade</LegalLink>.
            </span>
          </label>
        </div>

        <button
          type="submit"
          className="flex h-[50px] w-full flex-none cursor-pointer flex-row items-center justify-center rounded-[100px] bg-coral font-display text-[13px] leading-[1.3] font-bold whitespace-pre text-white shadow-lg shadow-coral/25 transition-colors select-none hover:bg-coral-hover md:text-[14px] lg:text-[15px] xl:text-base"
        >
          Começar meus 7 dias grátis
        </button>

        {/* Template build: nothing is transmitted, so say so instead of
            pretending a message went out. Not in the original — the original
            posts to Framer's form endpoint, which this clone has no use for. */}
        <p
          role="status"
          aria-live="polite"
          className="w-full font-display text-[11px] leading-[1.3] font-medium tracking-[-0.02em] md:text-[12px] lg:text-[13px] xl:text-[14px]"
          style={{ color: INK_50 }}
        >
          {sent
            ? "Este formulário ainda não está ligado a nenhum destino — falta conectar o endpoint de cadastro."
            : ""}
        </p>
      </form>
    </div>
  );
}

/** Label above its control, 12px apart, both full width. */
function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex w-full flex-none flex-col items-start justify-start gap-3">
      <span
        className="w-auto font-mono text-[12px] leading-[1.3] font-medium whitespace-pre uppercase md:text-[13px] lg:text-[14px]"
        style={{ color: INK_85 }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

/** 54px tall, 12px of padding, the text vertically centred inside it. */
function TextInput({
  type,
  name,
  placeholder,
  autoComplete,
}: {
  type: "text" | "email";
  name: string;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div
      className={`${FIELD_SHELL} flex h-[54px] items-center p-3`}
      style={FIELD_STYLE}
    >
      <input
        type={type}
        name={name}
        required
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${FIELD_TEXT} min-w-0 flex-1 overflow-hidden p-0 text-ellipsis whitespace-nowrap placeholder:text-[#1e1e2e4d]`}
      />
    </div>
  );
}

/**
 * `required` plus a disabled placeholder option makes the untouched select
 * `:invalid`, which is exactly when the original paints it in
 * --framer-input-invalid-text-color (30% ink).
 */
function Select({ name, options }: { name: string; options: string[] }) {
  return (
    <div className={`${FIELD_SHELL} h-[54px]`} style={FIELD_STYLE}>
      <select
        name={name}
        required
        defaultValue=""
        className={`${FIELD_TEXT} h-full cursor-pointer appearance-none bg-no-repeat p-3 invalid:text-[#1e1e2e4d]`}
        style={{
          backgroundImage: SELECT_CHEVRON,
          backgroundPosition: "right 12px center",
          backgroundSize: "16px",
        }}
      >
        <option value="" disabled>
          Select&hellip;
        </option>
        {options.map((o) => (
          <option key={o} value={o} className="text-ink">
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

/** Preset 1mdqpxb: underline, ink, hovering to 70% ink. No offset, no easing. */
function LegalLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className="underline hover:text-[#1e1e2eb3]">
      {children}
    </Link>
  );
}

/* ---------------------------------------------------------- testimonials */

type Card = {
  href: string;
  /** Nome do negócio, no lugar da logomarca do cliente que o template exibia. */
  negocio: string;
  quote: string;
  avatar: { file: string };
  name: string;
  role: string;
};

const CARDS: Card[] = [
  {
    href: "/historias/mercadinho-do-rodrigo",
    negocio: "Mercadinho do Rodrigo",
    quote:
      "“Uso para controlar fiado e estoque no mesmo lugar. A Mimu lembra quem me deve antes de eu esquecer.”",
    avatar: { file: "ZG1ulyOSE6IqRZHtg7SAYqykB1I.png" },
    name: "Rodrigo",
    role: "Mercadinho do Rodrigo",
  },
  {
    href: "/historias/manicure-da-carol",
    negocio: "Manicure da Carol",
    quote:
      "“Recomendo para toda amiga que também trabalha por conta. É simples, e parece que fizeram pensando em mim.”",
    avatar: { file: "QsqmBl8epkM6A7UWvnLY3DxB6sY.png" },
    name: "Carol",
    role: "Manicure da Carol",
  },
  {
    href: "/historias/barbearia-do-marcos",
    negocio: "Barbearia do Marcos",
    quote:
      "“Eu anotava tudo num caderno que vivia molhado no balcão. Agora falo com a Mimu entre um cliente e outro e pronto, tá lançado.”",
    avatar: { file: "ipx8j5wOmCg7qnlU6EwXrdHU.png" },
    name: "Marcos",
    role: "Barbearia do Marcos",
  },
];

/** 40px of vertical padding below 1200, 60px from there up. */
function Testimonials() {
  return (
    <section
      id="testimonials"
      className="flex w-full flex-col items-center justify-center overflow-clip bg-cream py-10 lg:py-15"
    >
      {/* 40px between children below 744, 60px from there up; the tablet band
          is the only one that lets the card row overflow. */}
      <div className="container-page flex flex-col items-center justify-center gap-10 overflow-clip md:gap-15 md:overflow-visible lg:overflow-clip">
        <div className="flex w-full flex-none flex-col items-start justify-center gap-4 md:flex-row">
          {CARDS.map((card) => (
            <Link
              key={card.href}
              to={card.href}
              className="flex w-full flex-none flex-row items-center justify-start gap-2.5 no-underline md:w-px md:flex-[1_0_0]"
            >
              <TestimonialCard card={card} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Sand card, 24px padding, 12px radius. From 744 up it holds a 360px floor and
 * pushes the byline to the bottom with space-between; below 744 the floor is
 * dropped and the two halves sit 40px apart at the top instead.
 */
function TestimonialCard({ card }: { card: Card }) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className="flex w-full flex-none flex-col items-start justify-start gap-10 overflow-clip rounded-xl bg-sand p-6 md:min-h-[360px] md:justify-between md:gap-0"
    >
      <div className="flex w-full flex-none flex-col items-start justify-center gap-4">
        {/* enter { opacity 0, x 5 } -> targetOpacity .7, tween 500ms/100ms. */}
        <div
          className="h-5 w-auto flex-none"
          style={{
            opacity: inView ? 0.7 : 0,
            transform: inView ? "translateX(0)" : "translateX(5px)",
            transition: `opacity 500ms ${EASE} 100ms, transform 500ms ${EASE} 100ms`,
            willChange: "transform",
          }}
        >
          <p className="font-display text-xs leading-5 font-bold tracking-[0.08em] whitespace-nowrap text-coral uppercase">
            {card.negocio}
          </p>
        </div>

        {/* effect `et`: { opacity .001, y 10 }, tween 400ms after 75ms. */}
        <p
          className="w-full font-display text-[15px] leading-[1.3] font-medium tracking-[-0.03em] text-ink md:text-[17px] lg:text-[19px] lg:leading-[1.4] xl:text-[20px] xl:leading-[1.3]"
          style={{
            opacity: inView ? 1 : 0.001,
            transform: inView ? "translateY(0)" : "translateY(10px)",
            transition: `opacity 400ms ${EASE} 75ms, transform 400ms ${EASE} 75ms`,
            willChange: "transform",
          }}
        >
          {card.quote}
        </p>
      </div>

      <div className="flex w-full flex-none flex-row items-end justify-start gap-2">
        {/* Decorativo: o retrato ainda é o do template, não o da pessoa citada.
            Quem carrega a identidade é a legenda ao lado. */}
        <Img
          src={`/img/${card.avatar.file}`}
          alt=""
          width={498}
          height={540}
          className="size-[55px] flex-none overflow-clip rounded-[100px] object-cover"
        />

        <div className="flex w-px flex-[1_0_0] flex-col items-center justify-center gap-1 overflow-clip">
          {/* effects `tt` / `nt`: { opacity .001, y 5 }, 1000ms after 200/300ms. */}
          <Byline delay={200} inView={inView}>
            <p
              className="w-full font-display text-[15px] leading-[1.3] font-medium tracking-[-0.02em] md:text-[16px] lg:text-[17px] lg:leading-[1.4] xl:text-[18px] xl:leading-[1.3]"
              style={{ color: INK_85 }}
            >
              {card.name}
            </p>
          </Byline>
          <Byline delay={300} inView={inView}>
            <p
              className="w-full font-display text-[9px] leading-[1.3] font-semibold tracking-[-0.02em] md:text-[10px] lg:text-[11px] xl:text-[12px]"
              style={{ color: INK_50 }}
            >
              {card.role}
            </p>
          </Byline>
        </div>
      </div>
    </div>
  );
}

function Byline({
  delay,
  inView,
  children,
}: {
  delay: number;
  inView: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="w-full"
      style={{
        opacity: inView ? 1 : 0.001,
        transform: inView ? "translateY(0)" : "translateY(5px)",
        transition: `opacity 1000ms ${EASE} ${delay}ms, transform 1000ms ${EASE} ${delay}ms`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
