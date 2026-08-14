import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router";
import { ehExterno } from "../lib/links";

type Variant = "dark" | "light" | "outline";

/**
 * As três variantes foram repintadas na paleta da Mimu, mas os NOMES ficaram:
 * eles já estão espalhados pelas seções, e renomeá-los trocaria dezenas de call
 * sites sem mudar nada no resultado.
 *
 *   dark    -> o CTA principal. Coral cheio, que é onde o manual manda usar a
 *              cor da marca, com a sombra coral que o site atual carrega.
 *   light   -> o mesmo botão sobre foto ou sobre o escuro: fundo branco e
 *              palavra coral, para o contraste não depender do que está atrás.
 *   outline -> o secundário das seções de produto — contorno coral que preenche
 *              no hover.
 */
const VARIANTS: Record<Variant, string> = {
  dark: "bg-coral text-primary-text shadow-lg shadow-coral/25 hover:bg-coral-hover",
  light: "bg-superficie text-coral hover:bg-coral-light",
  outline: "border-[1.5px] border-coral text-coral hover:bg-coral-light",
};

/** The pill CTA used across the page: 49px tall, fully rounded, chevron on the right. */
export function Button({
  to,
  children,
  variant = "dark",
  className = "",
  style,
}: {
  to: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
  /** Passthrough pra sobrescrever dimensões (ex.: CTA compacto do navbar)
      sem depender de qual utilitário Tailwind "ganha", inline sempre
      bate as classes de base, então não conflita com o `h-[49px]` etc. */
  style?: CSSProperties;
}) {
  // rounded-[8px]: brand book novo pede canto reto no botão (8px, não mais
  // o pill 1000px da paleta coral).
  const cls = `relative inline-flex h-[49px] items-center gap-2 rounded-[8px] py-[14px] pr-[14px] pl-4 font-display text-base font-bold tracking-[-0.32px] transition-colors duration-200 active:scale-[0.97] ${VARIANTS[variant]} ${className}`;

  const inner = (
    <>
      <span>{children}</span>
      <Chevron />
    </>
  );

  // Links externos, âncoras e destinos fora deste SPA (ex.: /cadastro, que
  // mora no app principal) saem como <a> pra fazer navegação de página cheia.
  return ehExterno(to) ? (
    <a href={to} className={cls} style={style}>
      {inner}
    </a>
  ) : (
    <Link to={to} className={cls} style={style}>
      {inner}
    </Link>
  );
}

/** 12x12 at stroke-width 2.5 in a 24-unit viewBox, matching the original. */
function Chevron() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Path lifted from the original's own chevron symbol: 7.5x15 units
          starting at (9, 4.5), not the 6x12 I had guessed. */}
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
