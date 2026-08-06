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
        "flex flex-shrink-0 items-center justify-center bg-coral",
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
          stroke="white"
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
        <p className="text-3xl font-medium leading-none tracking-[-0.5px] text-coral">
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
