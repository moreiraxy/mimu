import { Fragment } from "react";
import { Navigate, useParams } from "react-router";
import { Header } from "../components/Header";
import { Img } from "../components/Img";
import { Footer } from "../sections/Footer";
import { useInView } from "../hooks/useInView";
import { LEGAL, type Block, type Part } from "../data/legal";

/*
 * /legal/:slug — one layout, two documents. Every number below was read from
 * page_legal_privacy-policy.html's own inline <style> blocks (the terms page
 * ships byte-identical CSS) and from its page bundle
 * (js/AhnyE9ci-yuvoJL3M7QXGXtoiI2XNi_tFlMSzs1m-xg.ES9jWEYH.mjs).
 *
 *   layout  -> .framer-1ggt66t (hero) / ubo9on (hero container) / iqmgym
 *              (banner) / b44pt7 (overlay) / 50j4jy (h1) / 14gxd53 (updated)
 *              and .framer-1glng75 (article) / ouo5q1 (container) / 18ootvi
 *              (rich text)
 *   colours -> the token table, NOT the inline rgb() fallbacks, which claim
 *              #181818 for ink where the token is #1e1e2e.
 *   motion  -> effect `K` in the bundle: { blur 3px, opacity .001, y 10 },
 *              tokenization `line` with startDelay 0 — so every token shares
 *              one 500ms tween on cubic-bezier(.6,0,.4,1) after 200ms, i.e.
 *              the heading reveals as a single block, not word by word.
 *
 * Type presets, four tiers (<744 / 744-1199 / 1200-1439 / >=1440):
 *   zucctp  (h1)          40 / 52 / 58 / 64, lh 1.1em,  w500, -.03em
 *   z9blpo  (updated)     15 / 17 / 19 / 20, lh 1.3/1.3/1.4/1.3em, w500, -.03em
 *   13ki3cg (privacy h4)  18 / 20 / 22 / 24, lh 1.2em,  w500, -.04em
 *   12jcnw9 (terms h2)    24 / 28 / 32 / 36, lh 1.1em,  w500, -.04em
 *   qrzjf0  (body)        16 / 17 / 18 / 18, lh 1.4em,  w400, -.02em, ink 85%
 *
 * Framer turns --framer-paragraph-spacing into `margin-top` on every
 * .framer-text that is not its container's first child. The value comes from
 * the element's own preset, so a paragraph opens 20px below whatever precedes
 * it and a heading opens 32px below (20px for the terms h2 under 744).
 */

const EASE = "cubic-bezier(0.6, 0, 0.4, 1)";

/** 85% do escuro da marca (#1E1E2E), o tom de corpo de texto do manual. */
const INK_85 = "#1e1e2ed9";

/**
 * The overlay is a single gradient stop pair, and its second stop sits at
 * 171% — past the bottom of the box — so the darkest value actually painted is
 * well short of the 70% the token names. As porcentagens são do original; a cor
 * passou para o escuro da marca, já que o manual não admite preto puro.
 */
const OVERLAY = "linear-gradient(180deg, #1e1e2e00 0%, #1e1e2eb3 171%)";

export default function Legal() {
  const { slug } = useParams();
  const doc = slug ? LEGAL[slug] : undefined;

  // Only two slugs exist; anything else is not a legal page.
  if (!doc) return <Navigate to="/" replace />;

  const Heading = doc.heading;

  return (
    <>
      <Header />
      <main>
        {/* 60/80/100 top, 40/40/60 bottom. */}
        <section className="relative flex w-full flex-col items-center justify-center overflow-clip bg-bg pt-15 pb-10 md:pt-20 lg:pt-25 lg:pb-15">
          <div className="container-page flex flex-col items-center justify-center gap-10 overflow-clip md:gap-15">
            {/* Banner: a 3.375 letterbox at 1200+, a flat 320px on tablet, and
                a 1.20536 portrait capped at 320px below 744. */}
            <div className="relative flex aspect-[1.20536] max-h-[320px] w-full flex-none flex-col items-center justify-center gap-4 overflow-clip rounded-xl p-6 md:aspect-auto md:h-[320px] md:max-h-none lg:aspect-[3.375] lg:h-auto">
              <Img
                src="/img/AeRcUuogo8PqQ4xMEzB8fSQo3c.jpg"
                alt="Pintura em aquarela de colinas com neblina e pinheiros sob um céu nublado."
                width={4297}
                height={3159}
                priority
                className="absolute inset-0 size-full rounded-xl object-cover object-[center_bottom]"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-0 opacity-80"
                style={{ background: OVERLAY }}
              />

              {/* `order: 1` below 744 is the original's: on mobile the date
                  sits above the title, not under it. */}
              <Title text={doc.title} />

              <div className="relative z-[1] flex w-min flex-none flex-row items-center justify-center overflow-clip">
                <p className="w-auto text-center font-display text-[15px] leading-[1.3] font-medium whitespace-pre text-cream md:text-[17px] lg:text-[19px] lg:leading-[1.4] xl:text-[20px] xl:leading-[1.3]">
                  Atualizado em{" "}
                </p>
                <p className="w-auto text-center font-display text-[15px] leading-[1.3] font-medium whitespace-pre text-cream md:text-[17px] lg:text-[19px] lg:leading-[1.4] xl:text-[20px] xl:leading-[1.3]">
                  <time dateTime={doc.datetime}>{doc.updated}</time>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* The article container narrows to 60% of the viewport at 1200+ — not
            the 90% every other container on the site uses — so `container-page`
            does not apply here. */}
        <article className="flex w-full flex-col items-center justify-center overflow-clip pb-10 lg:pb-15">
          <div className="mx-auto flex w-[90%] max-w-[1200px] flex-col items-center justify-start gap-10 overflow-clip md:flex-row md:justify-center lg:w-[60%] lg:gap-15">
            <div
              id="content"
              className="w-full flex-none break-words whitespace-pre-wrap md:w-px md:max-w-[720px] md:flex-[1_0_0]"
            >
              {doc.blocks.map((block, i) => (
                <Fragment key={i}>
                  {"h" in block ? (
                    <Heading
                      className={
                        doc.heading === "h4"
                          ? "font-display text-[18px] leading-[1.2em] font-extrabold tracking-[-0.04em] text-ink [&:not(:first-child)]:mt-8 md:text-[20px] lg:text-[22px] xl:text-[24px]"
                          : "font-display text-[24px] leading-[1.1em] font-extrabold tracking-[-0.04em] text-ink [&:not(:first-child)]:mt-5 md:text-[28px] md:[&:not(:first-child)]:mt-8 lg:text-[32px] xl:text-[36px]"
                      }
                    >
                      {block.h}
                    </Heading>
                  ) : (
                    <p
                      className="font-display text-[16px] leading-[1.4em] font-normal tracking-[-0.02em] [&:not(:first-child)]:mt-5 md:text-[17px] lg:text-[18px]"
                      style={{ color: INK_85 }}
                    >
                      {block.p.map(renderPart)}
                    </p>
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

/** Preset 1mdqpxb: underline, ink, hovering to 70% ink. Bold runs go to 700. */
function renderPart(part: Part, i: number) {
  if (typeof part === "string") return <Fragment key={i}>{part}</Fragment>;
  if ("b" in part)
    return (
      <strong key={i} className="font-bold">
        {part.b}
      </strong>
    );
  return (
    <a key={i} href={part.href} className="text-coral underline hover:text-coral-hover">
      {part.a}
    </a>
  );
}

/**
 * 80% wide at 1200+, 90% below. Reveals as one block — see the note on `K` at
 * the top of the file — so <AnimatedText>'s per-word wipe is the wrong effect
 * here even though the SSR markup splits the title into character spans.
 */
function Title({ text }: { text: string }) {
  const { ref, inView } = useInView<HTMLHeadingElement>();

  return (
    <h1
      ref={ref}
      className="relative z-[1] order-1 w-[90%] flex-none text-center font-display text-[40px] leading-[1.1] font-extrabold tracking-[-0.03em] text-white will-change-transform md:order-none md:text-[52px] lg:w-4/5 lg:text-[58px] xl:text-[64px]"
      style={{
        opacity: inView ? 1 : 0.001,
        filter: inView ? "blur(0px)" : "blur(3px)",
        transform: inView ? "translateY(0)" : "translateY(10px)",
        transition: `opacity 500ms ${EASE} 200ms, filter 500ms ${EASE} 200ms, transform 500ms ${EASE} 200ms`,
      }}
    >
      {text}
    </h1>
  );
}
