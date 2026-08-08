import type { FormEvent } from "react";
import { Link } from "react-router";
import { Img } from "../components/Img";
import { Logo } from "../components/Logo";
import { useInView } from "../hooks/useInView";

/**
 * Footer. Every number below was read from the original's own CSS/HTML, never
 * estimated — the source rules live under `.framer-O9IKe` (footer scope).
 *
 * Type scale per breakpoint (mobile / tablet / desktop), line-height and
 * tracking are em-based so one class covers all three:
 *   heading      28 / 27 / 39px   lh 1em    ls -0.03em
 *   newsletter p 13 / 14 / 16px   lh 1.3em  ls -0.02em
 *   column head  12 / 13 / 14px   lh 1.3em
 *   footer link  15 / 16 / 18px   lh 1.3em  ls -0.02em
 *   copyright    13 / 14 / 16px   lh 1.3em  ls -0.02em
 */

const PATTERN = "/img/Jmgrh5qRTxPjX33edcBsgY4lJA.png";

const PRODUTO = [
  ["Produto", "/#produto"],
  ["Como funciona", "/#como-funciona"],
  ["Para quem é", "/#para-quem"],
  ["Preços", "/#precos"],
  ["Segurança", "/#seguranca"],
  ["Dúvidas", "/#duvidas"],
] as const;

const EMPRESA = [
  ["Histórias", "/historias"],
  ["Fale com a gente", "/contato"],
  ["oi@mimu.app", "mailto:oi@mimu.app"],
] as const;

const SOCIALS = [
  ["Siga a Mimu no Instagram", "https://www.instagram.com/", "lawigig2svht8xqAVTd0dm6Z2XY"],
  ["Siga a Mimu no LinkedIn", "https://www.linkedin.com/", "ekn77l6PEu99NPaYbN4J7Xhhfk4"],
  ["Siga a Mimu no Facebook", "https://www.facebook.com/", "Wc28Wmv6qRZFW1czVzUKnUm8b7w"],
  ["Siga a Mimu no X", "https://x.com/", "dbhFXxC2grvCHmbibjOHxxiULg"],
] as const;

/**
 * The footer's own appear config, read from the bundle at `framer-O9IKe`:
 * tween 500ms on cubic-bezier(.6,0,.4,1) after a 200ms delay.
 */
const REVEAL = "500ms cubic-bezier(0.6, 0, 0.4, 1) 200ms";
const HEADING_HIDDEN = {
  opacity: 0.001,
  filter: "blur(3px)",
  transform: "translateY(10px)",
};
const TEXT_HIDDEN = { opacity: 0, transform: "translateY(10px)" };
const SHOWN = { opacity: 1, filter: "blur(0px)", transform: "translateY(0)" };

/** Framer's documented fallback tick glyph, revealed by :checked. */
const TICK_MASK =
  'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M 4 8 L 6.5 10.5 L 11.5 5.5" fill="transparent" stroke-width="2" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>\')';

export function Footer() {
  return (
    // 40px vertical padding below 1200, 60px from there up. `overflow-clip`
    // is the original's, and it's what keeps the repeating pattern inside.
    <footer className="relative isolate overflow-clip bg-cream py-10 lg:py-15">
      <BgPattern />

      <div className="container-page flex flex-col gap-20 lg:gap-30">
        {/* Top row: newsletter and links share the width 50/50, split by an
            80px gutter on desktop and 40px on tablet; it stacks below 744. */}
        <div className="flex flex-col items-start gap-10 md:flex-row md:gap-x-10 lg:gap-x-20">
          <Newsletter />
          <SitemapColumns />
        </div>

        <Bottom />
      </div>
    </footer>
  );
}

/**
 * Dot tile behind the whole footer. Same 780px repeat as the Features cards,
 * but a different mask: this one peaks at 0.2 alpha along the bottom edge and
 * is fully gone 76% of the way up.
 */
function BgPattern() {
  const mask =
    "linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 76%)";
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10"
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

function Newsletter() {
  const { ref, inView } = useInView<HTMLDivElement>();

  // Template: there is no endpoint behind this, so the submit is swallowed.
  // The input keeps type="email" + required — the browser still validates.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => e.preventDefault();

  return (
    <div
      ref={ref}
      className="flex w-full flex-col items-start gap-4 overflow-clip rounded-xl border border-borda bg-superficie p-5 md:w-0 md:min-w-0 md:flex-1 lg:p-6"
    >
      <div className="flex w-full flex-col gap-2">
        <h2
          className="w-full font-display text-[28px] leading-[1em] font-extrabold tracking-[-0.03em] text-ink will-change-transform md:text-[27px] lg:text-[39px]"
          style={{
            ...(inView ? SHOWN : HEADING_HIDDEN),
            transition: `opacity ${REVEAL}, filter ${REVEAL}, transform ${REVEAL}`,
          }}
        >
          Dicas para o seu negócio
        </h2>

        {/* 85% wide, widening to 90% only on tablet — measured, not eyeballed. */}
        <p
          className="w-[85%] font-display text-[13px] leading-[1.4em] font-medium tracking-[-0.02em] text-muted-strong will-change-transform md:w-[90%] md:text-sm lg:w-[85%] lg:text-base"
          style={{
            ...(inView ? SHOWN : TEXT_HIDDEN),
            transition: `opacity ${REVEAL}, transform ${REVEAL}`,
          }}
        >
          Ideias simples para vender mais e se organizar melhor. Sem enrolação,
          e você sai quando quiser.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
        <div className="flex w-full items-center gap-1">
          <label className="relative flex h-11 min-w-0 flex-1 items-center rounded-md border border-borda bg-cream py-2 pr-2 pl-4 focus-within:border-coral">
            <span className="sr-only">Seu e-mail</span>
            <input
              type="email"
              name="email"
              required
              placeholder="voce@email.com"
              className="min-w-0 flex-1 overflow-hidden bg-transparent font-display text-base leading-[1.2em] font-normal text-ellipsis whitespace-nowrap text-ink outline-none placeholder:text-muted"
            />
          </label>

          {/* flex: .3 0 0 against the field's 1 0 0 — a 30/100 split of the row. */}
          <button
            type="submit"
            className="h-11 min-w-0 shrink-0 grow-[0.3] basis-0 rounded-md bg-coral transition-[background-color] duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] hover:bg-coral-hover"
          >
            <span className="font-display text-[11px] leading-[1.3em] font-bold tracking-[-0.02em] text-white md:text-xs lg:text-sm">
              Quero receber
            </span>
          </button>
        </div>

        <label className="flex w-full items-center gap-3">
          {/* 24px, r6, and the tick is a masked ::before revealed by :checked,
              which is how the original builds it. */}
          <input
            type="checkbox"
            name="newsletter"
            required
            className="relative size-6 shrink-0 appearance-none overflow-hidden rounded-[6px] border border-borda bg-cream before:absolute before:inset-0 before:bg-coral before:opacity-0 before:transition-opacity before:content-[''] before:[mask-image:var(--tick)] before:[mask-position:50%] before:[mask-repeat:no-repeat] before:[mask-size:contain] checked:before:opacity-100"
            style={{ ["--tick" as string]: TICK_MASK }}
          />
          <span className="min-w-0 flex-1 font-display text-[11px] leading-[1.3em] font-medium tracking-[-0.02em] text-muted md:text-xs lg:text-sm">
            Ao enviar, você concorda com os nossos{" "}
            <LegalLink to="/legal/termos">Termos de Uso</LegalLink> e a{" "}
            <LegalLink to="/legal/privacidade">Política de Privacidade</LegalLink>
          </span>
        </label>
      </form>
    </div>
  );
}

/**
 * Inline link inside the consent line. The original sets only three things on
 * it — underline, muted colour, and a hover that goes to full ink.
 */
function LegalLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} className="underline hover:text-ink">
      {children}
    </Link>
  );
}

function SitemapColumns() {
  return (
    <div className="flex w-full items-start gap-5 md:w-0 md:min-w-0 md:flex-1">
      <div className="flex min-w-0 flex-1 flex-col items-start gap-5 pt-1">
        <ColumnHeading>Produto</ColumnHeading>
        <LinkList links={PRODUTO} />
      </div>

      {/* Stretches to the taller column so the socials can sit on the floor —
          `justify-between` only works because of the self-stretch. */}
      <div className="flex min-w-0 flex-1 flex-col items-start justify-between self-stretch pt-1">
        <div className="flex w-full flex-col gap-5">
          <ColumnHeading>A Mimu</ColumnHeading>
          <LinkList links={EMPRESA} />
        </div>

        <div className="flex items-center gap-3">
          {SOCIALS.map(([label, href, file]) => (
            <div key={label} className="h-[22px] w-[21px]">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex size-full flex-col items-center justify-center opacity-70 transition-opacity hover:opacity-40"
              >
                <Img
                  src={`/img/${file}.png`}
                  alt=""
                  width={21}
                  height={21}
                  className="size-[21px] object-cover"
                />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ColumnHeading({ children }: { children: string }) {
  return (
    <p className="w-full font-display text-xs leading-[1.3em] font-bold tracking-[0.1em] text-coral uppercase md:text-[13px] lg:text-sm">
      {children}
    </p>
  );
}

function LinkList({ links }: { links: readonly (readonly [string, string])[] }) {
  return (
    <div className="flex w-full flex-col items-start gap-2">
      {links.map(([label, to]) => (
        <FooterLink key={label} to={to}>
          {label}
        </FooterLink>
      ))}
    </div>
  );
}

/**
 * The anchor spans the column but only the label fades on hover — that split
 * is the original's: the opacity variant sits on the inner text node, not
 * on the link box.
 */
function FooterLink({ to, children }: { to: string; children: string }) {
  const inner = (
    <span className="inline-block whitespace-pre transition-opacity duration-400 group-hover:opacity-50">
      {children}
    </span>
  );
  const cls =
    "group flex w-full flex-col items-start font-display text-[15px] leading-[1.3em] font-medium tracking-[-0.02em] text-ink no-underline md:text-base lg:text-lg";

  // mailto e âncoras continuam sendo <a>; só as rotas passam pelo router.
  return to.includes("#") || to.startsWith("mailto:") ? (
    <a href={to} className={cls}>
      {inner}
    </a>
  ) : (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  );
}

function Bottom() {
  return (
    <div className="flex w-full flex-col items-center gap-10">
      {/*
        O template fechava com um PNG do logotipo em 5% de opacidade. Aqui a
        assinatura é texto: o Nunito 800 é a própria letra da marca, então
        desenhá-la com fonte fica nítido em qualquer largura, acompanha o
        container sem esticar e dispensa mais um arquivo de imagem.
      */}
      <p
        aria-hidden="true"
        className="w-full text-center font-display text-[22vw] leading-[0.8] font-extrabold tracking-[-0.05em] text-coral/10 select-none lg:text-[260px]"
      >
        mimu
      </p>

      <div className="flex w-full flex-col items-center gap-6">
        <Logo tagline />

        <div className="flex w-full flex-col items-center justify-center gap-x-10 gap-y-2 overflow-clip md:flex-row md:justify-between">
          <p className="w-full text-center font-display text-[13px] leading-[1.3em] font-bold tracking-[-0.02em] text-muted md:min-w-0 md:flex-1 md:text-left md:text-sm lg:text-base">
            © 2026 Mimu · Enquanto você trabalha, a Mimu cuida do seu negócio.
          </p>

          <div className="flex w-full items-center justify-center gap-5 md:w-0 md:min-w-0 md:flex-1 md:justify-end">
            <BottomLink to="/legal/termos">Termos de Uso</BottomLink>
            <BottomLink to="/legal/privacidade">Privacidade</BottomLink>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Same link component as the sitemap, one preset smaller and muted. */
function BottomLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="group flex flex-col items-start font-display text-[13px] leading-[1.3em] font-bold tracking-[-0.02em] whitespace-nowrap text-muted no-underline md:text-sm lg:text-base"
    >
      <span className="inline-block transition-opacity duration-400 group-hover:opacity-50">
        {children}
      </span>
    </Link>
  );
}
