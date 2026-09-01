import { clsx } from "clsx";

export const MARK_PATH =
  "M2 34 L2 8 Q2 2 8 2 Q14 2 16 8 L24 24 L32 8 Q34 2 40 2 Q46 2 46 8 L46 34";

const sizes = {
  sm: { box: "h-9 w-9", icon: 20, rounded: "rounded-[10px]" },
  md: { box: "h-14 w-14", icon: 32, rounded: "rounded-2xl" },
  lg: { box: "h-20 w-20", icon: 48, rounded: "rounded-[20px]" },
} as const;

export function LogoMark({
  size = "md",
  className,
}: {
  size?: keyof typeof sizes;
  className?: string;
}) {
  const { box, icon, rounded } = sizes[size];
  return (
    <div
      className={clsx(
        "flex flex-shrink-0 items-center justify-center bg-primary",
        box,
        rounded,
        className,
      )}
    >
      <svg
        width={icon}
        height={icon * 0.75}
        viewBox="0 0 48 36"
        fill="none"
        aria-hidden="true"
      >
        <path
          d={MARK_PATH}
          // Preto, não branco: o "M" fica sobre o néon da marca, e branco
          // sobre #CCFF00 dá 1.18:1 de contraste — o traço some.
          stroke="#0A0A0A"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function Logo({
  size = "md",
  tagline = false,
  className,
}: {
  size?: keyof typeof sizes;
  tagline?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center gap-3.5", className)}>
      <LogoMark size={size} />
      <div>
        <p className="text-3xl font-semibold leading-none tracking-[-0.5px] text-primary-forte">
          mimu
        </p>
        {tagline && (
          <p className="mt-0.5 text-xs tracking-wide text-neutro-muted">
            seu negócio, organizado
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * A marca sozinha, em traço, herdando a cor de quem a usa.
 *
 * `LogoMark` é a marca em CAIXA: o M preto dentro do quadrado néon. Ela é a
 * assinatura da Mimu em fundo neutro — tela de entrada, cabeçalho, ícone do
 * app.
 *
 * Esta aqui é a marca sem caixa, para quando o fundo já é o material da
 * interface — o botão de vidro da barra de baixo. Sobre vidro, o quadrado
 * néon vira um adesivo colado por cima; o traço vazado deixa o desfoque
 * aparecer através da marca, que é o que faz ela parecer parte do botão.
 */
export function MarcaTraco({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox="0 0 48 36"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d={MARK_PATH}
        stroke="currentColor"
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
