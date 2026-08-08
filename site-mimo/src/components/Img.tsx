import { imgWidths } from "../generated/img-widths";

/**
 * Thin wrapper over <img> that gives every image the things the original
 * shipped without: explicit dimensions (no layout shift), lazy loading below
 * the fold, async decoding, and avif/webp at responsive widths.
 * `bun run images` generates those siblings and the width manifest.
 */
export function Img({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false,
  sizes,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  const variants = imgWidths[src];

  // Widths come from the manifest, never from `width`: the asset on disk is
  // often larger than the box it renders in, and a <source> pointing at a file
  // that was never generated wins the negotiation and renders broken.
  const resolved = variants
    ? // Full-bleed below the breakpoint, measured box above it. Single-variant
      // images get no `sizes` — there is nothing to choose between.
      (sizes ??
      (variants.length > 1
        ? `(max-width: 743px) 100vw, ${width}px`
        : undefined))
    : sizes;

  const img = (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      className={className}
    />
  );

  if (!variants) return img;

  const base = src.replace(/\.(png|jpe?g)$/i, "");
  const srcSet = (ext: string) =>
    variants.map((w) => `${base}-${w}.${ext} ${w}w`).join(", ");

  // `contents` keeps <picture> out of the box tree entirely and `hidden` keeps
  // the sources out of it, so the <img> stays the only box, still a direct
  // child of the same parent. Both are load-bearing: <picture> alone becomes a
  // flex item where the <img> was absolutely positioned, and un-hidden sources
  // are flex items of their own — each one worth another `gap` (that is +40px
  // on the closing CTA). Source selection reads the DOM, not the box tree, so
  // display:none costs nothing.
  return (
    <picture className="contents">
      <source
        className="hidden"
        type="image/avif"
        srcSet={srcSet("avif")}
        sizes={resolved}
      />
      <source
        className="hidden"
        type="image/webp"
        srcSet={srcSet("webp")}
        sizes={resolved}
      />
      {img}
    </picture>
  );
}
