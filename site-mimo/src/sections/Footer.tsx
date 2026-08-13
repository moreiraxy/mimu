import type { FormEvent } from "react";
import { Link } from "react-router";
import { Img } from "../components/Img";
import { Logo } from "../components/Logo";
import { useInView } from "../hooks/useInView";

/**
 * Footer — reorganizado numa grade de 4 colunas (marca | Produto | A Mimu |
 * newsletter) em vez do bloco newsletter+links empilhado que tinha antes.
 * O wordmark gigante saiu daqui: o CTA final (CtaV2.tsx), a seção logo
 * acima, já fecha com o mesmo recurso — repetir os dois um atrás do outro
 * ficava redundante.
 *
 * Type scale per breakpoint (mobile / tablet / desktop), line-height e
 * tracking são em em, então uma classe cobre as três:
 *   newsletter p 13 / 14 / 16px   lh 1.3em  ls -0.02em
 *   column head  12 / 13 / 14px   lh 1.3em
 *   footer link  15 / 16 / 18px   lh 1.3em  ls -0.02em
 *   copyright    13 / 14 / 16px   lh 1.3em  ls -0.02em
 */

const PATTERN = "/img/Jmgrh5qRTxPjX33edcBsgY4lJA.png";

// "Como funciona" saiu: apontava pra `/#como-funciona`, âncora que só existe
// em HowItWorks.tsx — fora da composição da Home desde a mesclagem
// site-v2+site-mimo. "Para quem é" tinha o mesmo problema (WhoWeServe.tsx,
// também fora da composição). O link do Header pra "Como funciona" continua
// apontando pra essa mesma âncora inexistente — fora do escopo pedido aqui
// (Header não muda), mas fica registrado: precisa de uma seção "como
// funciona" de verdade, ou o link muda de destino.
const PRODUTO = [
  ["Produto", "/#produto"],
  ["Preços", "/#precos"],
  ["Segurança", "/#seguranca"],
  ["Dúvidas", "/#duvidas"],
] as const;

const EMPRESA = [
  ["Histórias", "/historias"],
  ["oi@mimu.app", "mailto:oi@mimu.app"],
] as const;

const SOCIALS = [
  ["Siga a Mimu no Instagram", "https://www.instagram.com/", "lawigig2svht8xqAVTd0dm6Z2XY"],
  ["Siga a Mimu no LinkedIn", "https://www.linkedin.com/", "ekn77l6PEu99NPaYbN4J7Xhhfk4"],
  ["Siga a Mimu no Facebook", "https://www.facebook.com/", "Wc28Wmv6qRZFW1czVzUKnUm8b7w"],
  ["Siga a Mimu no X", "https://x.com/", "dbhFXxC2grvCHmbibjOHxxiULg"],
] as const;

/** Framer's documented fallback tick glyph, revealed by :checked. */
const TICK_MASK =
  'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><path d="M 4 8 L 6.5 10.5 L 11.5 5.5" fill="transparent" stroke-width="2" stroke="black" stroke-linecap="round" stroke-linejoin="round"/></svg>\')';

export function Footer() {
  return (
    <footer className="relative isolate overflow-clip bg-ink-soft py-16 lg:py-20">
      <BgPattern />

      <div className="container-page flex flex-col gap-16 lg:gap-20">
        <div className="grid w-full grid-cols-1 gap-12 md:grid-cols-[1.2fr_1fr_1fr_1.4fr]">
          <BrandColumn />

          <div className="flex flex-col items-start gap-5">
            <ColumnHeading>Produto</ColumnHeading>
            <LinkList links={PRODUTO} />
          </div>

          <div className="flex flex-col items-start gap-5">
            <ColumnHeading>A Mimu</ColumnHeading>
            <LinkList links={EMPRESA} />
          </div>

          <Newsletter />
        </div>

        <Bottom />
      </div>
    </footer>
  );
}

function BrandColumn() {
  return (
    <div className="flex flex-col items-start gap-5">
      <Logo />
      <p className="max-w-[220px] text-sm leading-[1.4] text-muted-strong">
        Enquanto você trabalha, a Mimu cuida do seu negócio.
      </p>
      <div className="flex items-center gap-3">
        {SOCIALS.map(([label, href, file]) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            className="flex size-[22px] shrink-0 items-center justify-center opacity-60 transition-opacity hover:opacity-100"
          >
            {/* Os PNGs do template são quase pretos (#1a1a1a) — foram feitos
                pra fundo claro e sumiam no rodapé escuro. `invert` os deixa
                brancos sem precisar refazer os arquivos. */}
            <Img
              src={`/img/${file}.png`}
              alt=""
              width={21}
              height={21}
              className="size-[21px] object-cover invert"
            />
          </a>
        ))}
      </div>
    </div>
  );
}

/**
 * Dot tile behind the whole footer. Same 780px repeat as the Features cards,
 * but a different mask: this one peaks at 0.2 alpha along the bottom edge and
 * is fully gone 76% of the way up.
 */
function BgPattern() {
  const mask = "linear-gradient(0deg, rgba(0, 0, 0, 0.2) 0%, rgba(0, 0, 0, 0) 76%)";
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
      className="flex w-full flex-col items-start gap-4 overflow-clip rounded-xl border border-borda bg-superficie p-5 lg:p-6"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 500ms cubic-bezier(0.6,0,0.4,1), transform 500ms cubic-bezier(0.6,0,0.4,1)",
      }}
    >
      <div className="flex w-full flex-col gap-2">
        <h2 className="w-full font-display text-xl leading-[1.15em] font-extrabold tracking-[-0.02em] text-ink">
          Dicas para o seu negócio
        </h2>
        <p className="w-full font-display text-[13px] leading-[1.4em] font-medium tracking-[-0.02em] text-muted-strong">
          Ideias simples para vender mais e se organizar melhor. Sem enrolação, e você sai quando quiser.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex w-full flex-col gap-4">
        {/* Empilhado, não lado a lado: no rodapé de 4 colunas esta coluna é
            estreita, e o botão em `grow-[0.3]` ficava com ~23% da linha —
            "Quero receber" quebrava em duas linhas e vazava do botão. */}
        <div className="flex w-full flex-col gap-2">
          <label className="relative flex h-11 w-full items-center rounded-md border border-borda bg-bg py-2 pr-2 pl-4 focus-within:border-coral">
            <span className="sr-only">Seu e-mail</span>
            <input
              type="email"
              name="email"
              required
              placeholder="voce@email.com"
              className="min-w-0 flex-1 overflow-hidden bg-transparent font-display text-base leading-[1.2em] font-normal text-ellipsis whitespace-nowrap text-ink outline-none placeholder:text-muted"
            />
          </label>

          <button
            type="submit"
            className="h-11 w-full rounded-md bg-coral transition-[background-color] duration-200 ease-[cubic-bezier(0.44,0,0.56,1)] hover:bg-coral-hover"
          >
            <span className="font-display text-sm leading-[1.3em] font-bold tracking-[-0.02em] whitespace-nowrap text-primary-text">
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
            className="relative size-6 shrink-0 appearance-none overflow-hidden rounded-[6px] border border-borda bg-bg before:absolute before:inset-0 before:bg-coral before:opacity-0 before:transition-opacity before:content-[''] before:[mask-image:var(--tick)] before:[mask-position:50%] before:[mask-repeat:no-repeat] before:[mask-size:contain] checked:before:opacity-100"
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
    <div className="flex w-full flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 md:flex-row">
      <p className="text-center text-sm font-bold tracking-[-0.02em] text-muted md:text-left">
        © 2026 Mimu · Enquanto você trabalha, a Mimu cuida do seu negócio.
      </p>

      <div className="flex items-center gap-5">
        <BottomLink to="/legal/termos">Termos de Uso</BottomLink>
        <BottomLink to="/legal/privacidade">Privacidade</BottomLink>
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
      <span className="inline-block transition-opacity duration-400 group-hover:opacity-50">{children}</span>
    </Link>
  );
}
