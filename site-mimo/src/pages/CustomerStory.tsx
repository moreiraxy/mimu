import { useParams } from "react-router";
import { AnimatedText } from "../components/AnimatedText";
import { Header } from "../components/Header";
import { Img } from "../components/Img";
import { Footer } from "../sections/Footer";
import { BY_SLUG, type Block, type Story } from "../data/customerStories";
import { Pill, RING, StoryCard } from "./CustomerStories";

/*
 * /customer-stories/:slug — the four case studies.
 *
 * The four routes ship byte-identical CSS, so one component covers them and
 * only the content differs; that content lives in src/data/customerStories.ts,
 * parsed out of the pages rather than retyped. Layout comes from this route's
 * own stylesheet, parsed with brace control:
 *   hero     -> .framer-18dzc3i / d1z5x8 / ps4khm / 9wpjav / az4cw2 / bv8ert / hw7c8f
 *   body     -> .framer-2wi17e / 1f2pr76 / ug3y2n / 1lhgcql / 18ooo3q / d6mwgx
 *   stats    -> the .framer-Dy4XP component scope (.framer-ico6r1 + v-imp9t6)
 *   article  -> .framer-1t80eoa and presets 12jcnw9 / qrzjf0 / 1tb6zeb / btp02y
 *   cta      -> .framer-2coun2 / 1sg9ut9 / 1e7ipyl
 *   others   -> .framer-sl5oc / cl871x / motno / 5k6ih7 / 1h9v4op / fso48z
 *
 * Colours are the resolved tokens, never the inline rgb() fallbacks:
 *   #1e1e2e ink  #f7f6f3 cream  #ece9e2 sand  #2a2a3d ink-soft
 *   #1e1e2e1a 10%  #1e1e2e4d 30%  #1e1e2e80 50%  #1e1e2ed9 85%
 *   #f7f6f34d 30%  #f7f6f3b3 70%
 *
 * Type presets, four tiers each (<744 / 744-1199 / 1200-1439 / >=1440):
 *   1ftj7oj hero h1  30 / 38 / 45 / 49  lh 1.2em  w500  ls -.03/-.03/-.05/-.03em
 *   1ps4rup h2       32 / 36 / 40 / 44  lh 1.1em  w500  ls -.01em
 *   12jcnw9 article  24 / 28 / 32 / 36  lh 1.1em  w500  ls -.04em
 *   qrzjf0  prose    16 / 17 / 18 / 18  lh 1.4em  w400  ls -.02em  #1e1e2ed9
 *   1tb6zeb quote    16 / 17 / 18 / 18  lh 1.4em  w500  ls 0  italic  #2a2a3d
 *   lajpag  company  22 / 25 / 28 / 31  lh 1.3/1.2/1.2/1.2em  w500  ls -.03em
 *   z9blpo  pull     15 / 17 / 19 / 20  lh 1.3/1.3/1.4/1.3em  w500  ls -.03em
 *   168zpc5 meta     15 / 16 / 17 / 18  lh 1.3/1.3/1.4/1.3em  w500  ls -.02em
 *   1req7v1 stat     24 / 28 / 36 / 36  lh 1.1em  w500  ls -.02em
 *   s9koru  small    13 / 14 / 15 / 16  lh 1.3em  w500  ls -.02em
 *   ckayli  eyebrow  12 / 13 / 14 / 14  lh 1.3em  w500  ls 0  Geist Mono, upper
 *
 * Article spacing is one rule, not per-preset margins:
 *   .framer-text:not(:first-child) { margin-top: var(--framer-blockquote-
 *     paragraph-spacing, var(--framer-paragraph-spacing, 0)) }
 * `.framer-1t80eoa` sets --framer-paragraph-spacing: 32px, so every block after
 * the first is 32px down; a blockquote carries its own 20px and passes it to
 * the second <p> inside it.
 */

/** The three share targets. The X mark ships as SVG; the other two match the
    files the footer already uses for Facebook and LinkedIn. */
const SHARE = [
  ["Share on X", "https://x.com/intent/post?url="],
  ["Share on Facebook", "https://www.facebook.com/sharer/sharer.php?u="],
  ["Share on LinkedIn", "https://www.linkedin.com/sharing/share-offsite/?url="],
] as const;

export default function CustomerStory() {
  const { slug } = useParams();
  const story = slug ? BY_SLUG.get(slug) : undefined;

  if (!story) {
    return (
      <>
        <Header />
        <main className="container-page flex min-h-[60vh] flex-col justify-center pt-40 pb-30">
          <h1 className="font-display text-[30px] leading-[1.2] font-medium tracking-[-0.03em] md:text-[38px] lg:text-[45px] lg:tracking-[-0.05em] xl:text-[49px] xl:tracking-[-0.03em]">
            That story doesn't exist.
          </h1>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        {/* padding 100/0/0 -> 120/0/40 -> 160/0/40. */}
        <article className="relative flex w-full flex-none flex-col items-center justify-center overflow-clip bg-bg pt-25 md:pt-30 md:pb-10 lg:pt-40">
          <div className="container-page flex flex-col items-start justify-center gap-5">
            <div className="flex w-min flex-none items-center justify-start gap-3 overflow-clip">
              <p className="w-auto flex-none font-display text-[15px] leading-[1.3] font-medium tracking-[-0.02em] whitespace-pre text-ink md:text-base lg:text-[17px] lg:leading-[1.4] xl:text-[18px] xl:leading-[1.3]">
                {story.eyebrow}
              </p>
              {/* 5px square: aspect-ratio 1 against an explicit 5px width. */}
              <span
                aria-hidden="true"
                className="aspect-square w-[5px] flex-none overflow-clip rounded-[100px] bg-[#1e1e2e4d]"
              />
              <p className="w-auto flex-none font-display text-[15px] leading-[1.3] font-medium tracking-[-0.02em] whitespace-pre text-[#1e1e2e80] md:text-base lg:text-[17px] lg:leading-[1.4] xl:text-[18px] xl:leading-[1.3]">
                {story.category}
              </p>
            </div>

            <AnimatedText
              as="h1"
              text={story.heading}
              className="w-[90%] flex-none font-display text-[30px] leading-[1.2] font-medium tracking-[-0.03em] break-words whitespace-pre-wrap text-ink [text-wrap:wrap] md:w-4/5 md:text-[38px] lg:w-[70%] lg:text-[45px] lg:tracking-[-0.05em] xl:text-[49px] xl:tracking-[-0.03em]"
            />
          </div>
        </article>

        {/* padding 20/0/40 -> 0/0/40 -> 0/0/60. */}
        <section
          id="testimonials"
          className="relative flex w-full flex-none flex-col items-center justify-start overflow-clip bg-bg pt-5 pb-10 md:pt-0 lg:pb-15"
        >
          {/* Only the tablet band lets this box overflow; the sticky sidebar
              still works either way because `clip` is not a scroll container. */}
          <div className="container-page flex flex-col items-start justify-center gap-10 overflow-clip md:flex-row md:overflow-visible lg:gap-15 lg:overflow-clip">
            <Sidebar story={story} />

            <div className="flex w-full flex-none flex-col items-start gap-5 overflow-clip md:w-px md:flex-[3_0_0] lg:gap-6">
              <div className="relative flex aspect-[1.43617] w-full flex-none items-center justify-center overflow-clip rounded-xl md:aspect-[1.5] lg:aspect-[1.94286]">
                <Img
                  src={`/img/${story.banner.file}`}
                  alt={story.banner.alt}
                  width={story.banner.w}
                  height={story.banner.h}
                  priority
                  sizes="(min-width: 1200px) 760px, (min-width: 744px) 60vw, 90vw"
                  className="absolute inset-0 size-full rounded-[inherit] object-cover object-center"
                />
              </div>

              <Pullquote story={story} />
              <Stats story={story} />
              <Body blocks={story.body} />
              <CaseCta heading={story.ctaHeading} />
            </div>
          </div>
        </section>

        <OtherStories story={story} />
      </main>
      <Footer />
    </>
  );
}

/** Left rail: sticky at 140px from 744 up, in normal flow below that. */
function Sidebar({ story }: { story: Story }) {
  const url = typeof window === "undefined" ? "" : window.location.href;

  return (
    <div className="z-1 flex w-full flex-none flex-col items-start gap-5 overflow-clip md:sticky md:top-[140px] md:w-px md:flex-[1.5_0_0]">
      <Divider />

      <div className="flex w-full flex-none flex-col items-center justify-center gap-3 overflow-clip">
        <p className="line-clamp-2 w-full flex-none font-display text-[22px] leading-[1.3] font-medium tracking-[-0.03em] break-words whitespace-pre-line text-ink md:text-[25px] md:leading-[1.2] lg:text-[28px] xl:text-[31px]">
          {story.company}
        </p>
        <p className="w-full flex-none overflow-clip font-display text-[15px] leading-[1.3] font-medium tracking-[-0.02em] break-words whitespace-pre-wrap text-ink opacity-60 md:text-base lg:text-[17px] lg:leading-[1.4] xl:text-[18px] xl:leading-[1.3]">
          {story.about}
        </p>
      </div>

      <Divider />

      <dl className="flex w-full flex-none flex-col items-center justify-center gap-5 overflow-clip">
        {story.info.map(([label, value]) => (
          <div
            key={label}
            className="flex w-full flex-none items-center justify-start gap-3 overflow-clip"
          >
            <dt className="line-clamp-2 w-px flex-[1_0_0] font-display text-[15px] leading-[1.3] font-medium tracking-[-0.02em] break-words whitespace-pre-line text-ink md:text-base lg:text-[17px] lg:leading-[1.4] xl:text-[18px] xl:leading-[1.3]">
              {label}
            </dt>
            <dd className="line-clamp-2 w-px flex-[1_0_0] text-right font-display text-[15px] leading-[1.3] font-medium tracking-[-0.02em] break-words whitespace-pre-line text-ink opacity-60 md:text-base lg:text-[17px] lg:leading-[1.4] xl:text-[18px] xl:leading-[1.3]">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <Divider />

      <div className="relative z-1 flex w-full flex-none items-end justify-between overflow-clip rounded-[2px]">
        <p className="line-clamp-2 w-px flex-[1_0_0] font-display text-[15px] leading-[1.3] font-medium tracking-[-0.02em] break-words whitespace-pre-line text-ink md:text-base lg:text-[17px] lg:leading-[1.4] xl:text-[18px] xl:leading-[1.3]">
          {story.shareLabel}
        </p>

        <div className="flex min-w-max items-center justify-center gap-3 bg-bg">
          {story.shareIcons.map((file, i) => {
            const target = SHARE[i];
            if (!target) return null;
            const [label, href] = target;
            return (
              <a
                key={file}
                href={href + encodeURIComponent(url)}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="block size-6 overflow-hidden transition-transform hover:scale-110"
              >
                <img
                  src={`/img/${file}`}
                  alt=""
                  width={24}
                  height={24}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              </a>
            );
          })}
        </div>
      </div>

      <Divider />
    </div>
  );
}

function Divider() {
  return (
    <div
      aria-hidden="true"
      className="h-px w-full flex-none overflow-clip bg-[#1e1e2e1a]"
    />
  );
}

/** Sand card holding the customer quote, with the outline quote mark on top. */
function Pullquote({ story }: { story: Story }) {
  return (
    <div className="relative flex w-full flex-none items-start justify-between overflow-clip rounded-xl bg-sand p-4 lg:p-5">
      <figure className="flex w-[85%] flex-none flex-col items-start justify-start gap-6">
        <blockquote className="w-full flex-none font-display text-[15px] leading-[1.3] font-medium tracking-[-0.03em] break-words whitespace-pre-wrap text-ink-soft md:text-[17px] lg:text-[19px] lg:leading-[1.4] xl:text-[20px] xl:leading-[1.3]">
          {story.quote}
        </blockquote>

        <div className="flex w-min flex-none items-end justify-start gap-3">
          <span className="relative aspect-square w-14 flex-none overflow-clip rounded-[1000px]">
            <Img
              src={`/img/${story.avatar.file}`}
              alt={story.avatar.alt}
              width={story.avatar.w}
              height={story.avatar.h}
              sizes="56px"
              className="absolute inset-0 size-full rounded-[inherit] object-cover object-center"
            />
          </span>

          <figcaption className="flex w-min flex-none flex-col items-start gap-1 overflow-clip">
            <p className="w-auto flex-none font-display text-[15px] leading-[1.3] font-medium tracking-[-0.03em] whitespace-pre text-ink-soft opacity-80 md:text-[17px] lg:text-[19px] lg:leading-[1.4] xl:text-[20px] xl:leading-[1.3]">
              {story.name}
            </p>
            <p className="w-auto flex-none font-display text-[13px] leading-[1.3] font-medium tracking-[-0.02em] whitespace-pre text-ink-soft opacity-60 md:text-[14px] lg:text-[15px] xl:text-base">
              {story.role}
            </p>
          </figcaption>
        </div>
      </figure>

      {/* 71x50 box, inset 12 -> 16 -> 20 from the top-right corner. */}
      <div className="absolute top-3 right-3 z-1 flex h-[50px] w-[71px] flex-none items-center justify-center overflow-clip md:top-4 md:right-4 lg:top-5 lg:right-5">
        <svg
          viewBox="0 0 70.95 49.797"
          className="size-full"
          aria-hidden="true"
          style={{ imageRendering: "pixelated" }}
        >
          <path
            fill="#1e1e2e1a"
            d="M 13.639 33.412 C 5.719 31.866 0.003 24.929 0 16.86 C 0 7.554 7.554 0 16.86 0 C 26.166 0 33.719 7.554 33.719 16.86 C 33.719 29.261 29.542 36.963 24.638 41.778 C 17.13 49.15 7.729 49.79 7.729 49.79 C 6.773 49.861 5.862 49.373 5.392 48.537 C 4.922 47.702 4.977 46.67 5.534 45.89 C 5.534 45.89 10.002 39.6 12.788 34.947 C 13.078 34.459 13.372 33.921 13.639 33.412 Z M 50.869 33.412 C 42.95 31.866 37.234 24.929 37.231 16.86 C 37.231 7.554 44.784 0 54.09 0 C 63.396 0 70.95 7.554 70.95 16.86 C 70.95 29.261 66.772 36.963 61.868 41.778 C 54.361 49.15 44.959 49.79 44.959 49.79 C 44.003 49.861 43.093 49.373 42.623 48.537 C 42.153 47.702 42.208 46.67 42.765 45.89 C 42.765 45.89 47.233 39.6 50.018 34.947 C 50.308 34.459 50.602 33.921 50.869 33.412 Z"
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * The dark stat cards: two on secondogo/thirdogo, three on firstogo/fourthogo.
 * They stack into a column below 744 and each card flips to a row there. The
 * dotted rule is a real border on every card but the last — on the right at
 * 744+, along the bottom below it.
 */
function Stats({ story }: { story: Story }) {
  const last = story.stats.length - 1;
  return (
    <div className="flex w-full flex-none flex-col items-end justify-center gap-2 overflow-clip md:flex-row">
      {story.stats.map(([value, label], i) => (
        <div
          key={label}
          className="h-auto w-full flex-none md:h-[195px] md:w-px md:flex-[1_0_0]"
        >
          <div
            className={`relative flex size-full flex-row items-start justify-between overflow-clip rounded-lg bg-ink-soft p-4 md:flex-col ${
              i === last
                ? ""
                : `after:border-b after:border-dotted after:border-[#f7f6f34d] md:after:border-r md:after:border-b-0 ${RING}`
            }`}
          >
            <div className="flex w-4/5 flex-none flex-col items-start justify-center gap-1">
              <p className="w-full flex-none font-display text-2xl leading-[1.1] font-medium tracking-[-0.02em] break-words whitespace-pre-wrap text-cream md:text-[28px] lg:text-[36px]">
                {value}
              </p>
              <p className="w-full flex-none font-display text-[13px] leading-[1.3] font-medium tracking-[-0.02em] break-words whitespace-pre-wrap text-[#f7f6f3b3] md:text-[14px] lg:text-[15px] xl:text-base">
                {label}
              </p>
            </div>

            <div className="flex w-min flex-none items-center justify-end">
              <GridIcon />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 3x3 dot grid inside a rounded square, at 1.5 stroke — the original's icon. */
function GridIcon() {
  const at = [4.5, 10.875, 17.25];
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="block">
      <path
        d="M 1.5 18 C 0.672 18 0 17.328 0 16.5 L 0 1.5 C 0 0.672 0.672 0 1.5 0 L 16.5 0 C 17.328 0 18 0.672 18 1.5 L 18 16.5 C 18 17.328 17.328 18 16.5 18 Z"
        transform="translate(3 3)"
        fill="none"
        stroke="#f7f6f3"
        strokeWidth="1.5"
      />
      {at.map((y) =>
        at.map((x) => (
          <circle key={`${x}-${y}`} cx={x + 1.125} cy={y + 1.125} r="1.125" fill="#f7f6f3" />
        )),
      )}
    </svg>
  );
}

/** The article. One 32px rule sets every gap; a pull quote overrides it to 20. */
function Body({ blocks }: { blocks: Block[] }) {
  return (
    <div className="w-full flex-none">
      {blocks.map((b, i) => {
        const gap = i === 0 ? "" : b.t === "quote" ? "mt-5" : "mt-8";

        if (b.t === "h2") {
          return (
            <h2
              key={i}
              className={`font-display text-2xl leading-[1.1] font-medium tracking-[-0.04em] break-words whitespace-pre-wrap text-ink [text-wrap:wrap] md:text-[28px] lg:text-[32px] xl:text-[36px] ${gap}`}
            >
              {b.text}
            </h2>
          );
        }

        if (b.t === "p") {
          return (
            <p
              key={i}
              className={`font-display text-base leading-[1.4] font-normal tracking-[-0.02em] break-words whitespace-pre-wrap text-[#1e1e2ed9] md:text-[17px] lg:text-[18px] ${gap}`}
            >
              {b.text}
            </p>
          );
        }

        if (b.t === "img") {
          return (
            <Img
              key={i}
              src={`/img/${b.file}`}
              alt={b.alt}
              width={b.w}
              height={b.h}
              sizes="(min-width: 1200px) 760px, (min-width: 744px) 60vw, 90vw"
              className={`w-full rounded-xl ${gap}`}
            />
          );
        }

        /* Pull quote: 24px of left padding cleared for a 4px full-height bar,
           drawn with ::before so it never enters the text flow. */
        return (
          <blockquote
            key={i}
            className={`relative pl-6 font-display text-base leading-[1.4] font-medium tracking-normal break-words whitespace-pre-wrap text-ink-soft italic before:absolute before:top-0 before:left-0 before:block before:h-full before:w-1 before:bg-[#1e1e2e1a] before:content-[''] md:text-[17px] lg:text-[18px] ${gap}`}
          >
            {b.lines.map((line, j) => (
              <p key={j} className={j === 0 ? "" : "mt-5"}>
                {line}
              </p>
            ))}
          </blockquote>
        );
      })}
    </div>
  );
}

/** Photo panel closing the article: 80px of vertical padding, scrim, heading, pill. */
function CaseCta({ heading }: { heading: string }) {
  return (
    <div className="relative z-2 flex w-full flex-none flex-col items-center justify-center gap-5 overflow-clip rounded-xl py-20">
      <Img
        src="/img/AeRcUuogo8PqQ4xMEzB8fSQo3c.jpg"
        alt="A serene watercolor landscape used as the call-to-action background."
        width={4297}
        height={3159}
        sizes="(min-width: 1200px) 760px, (min-width: 744px) 60vw, 90vw"
        className="absolute inset-0 size-full rounded-[inherit] object-cover object-[center_bottom]"
      />

      {/* 160% tall and a pixel to the left, exactly as authored. */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-[-1px] z-0 h-[160%] w-full overflow-clip opacity-[0.48]"
        style={{
          background: "linear-gradient(180deg, #1e1e2e -30%, #1e1e2e00 61.5921%)",
        }}
      />

      <AnimatedText
        text={heading}
        className="relative z-1 w-[90%] flex-none text-center font-display text-[32px] leading-[1.1] font-medium tracking-[-0.01em] break-words whitespace-pre-wrap text-cream [text-wrap:wrap] md:text-[36px] lg:text-[40px] xl:text-[44px]"
      />

      <div className="relative z-1">
        <Pill to="/cadastro" tone="light">
          Get a free demo
        </Pill>
      </div>
    </div>
  );
}

/** The two sibling cases, in the same grid the index route uses. */
function OtherStories({ story }: { story: Story }) {
  const others = story.others
    .map((s) => BY_SLUG.get(s))
    .filter((s): s is Story => Boolean(s));

  return (
    <section className="relative flex w-full flex-none flex-col items-center justify-start overflow-clip bg-bg py-10 lg:py-15">
      <div className="container-page flex flex-col items-center gap-10 md:gap-9">
        {/* Below 744 this stacks and the label jumps above the heading. */}
        <div className="flex w-full flex-none flex-col items-center justify-start gap-5 overflow-clip md:flex-row md:items-end md:justify-between md:gap-0">
          <div className="order-0 md:order-none">
            <div className="flex w-min flex-none items-center justify-start gap-2.5 overflow-clip text-ink">
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-[100px] bg-current"
              />
              <p className="w-auto flex-none font-mono text-xs leading-[1.3] font-medium whitespace-pre uppercase md:text-[13px] lg:text-sm">
                {story.otherLabel}
              </p>
            </div>
          </div>

          <AnimatedText
            text={story.otherHeading}
            className="order-1 w-[90%] flex-none text-center font-display text-[32px] leading-[1.1] font-medium tracking-[-0.01em] break-words whitespace-pre-wrap text-ink [text-wrap:wrap] md:order-none md:w-[65%] md:text-left md:text-[36px] lg:w-2/5 lg:text-[40px] xl:text-[44px]"
          />
        </div>

        <div className="flex w-full flex-none flex-col items-start justify-center gap-4">
          <ul className="grid w-full grid-cols-1 justify-center gap-4 md:grid-cols-2">
            {others.map((s) => (
              <li key={s.slug} className="w-full">
                <StoryCard story={s} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
