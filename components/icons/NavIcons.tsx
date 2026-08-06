import type { SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "viewBox" | "fill"> & {
  size?: number;
};

function baseProps({ size = 22, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 12 L12 5 L20 12" />
      <path d="M6 10.5 V19 A1 1 0 0 0 7 20 H17 A1 1 0 0 0 18 19 V10.5" />
      <path d="M10 20 V14 H14 V20" />
    </svg>
  );
}

export function AgendaIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="M4 10 H20" />
      <path d="M8 3 V6" />
      <path d="M16 3 V6" />
    </svg>
  );
}

export function FinanceiroIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="6" width="18" height="13" rx="3" />
      <path d="M3 10 H21" />
      <circle cx="17" cy="13.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ClientesIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="8" cy="8" r="3" />
      <path d="M3 20 Q3 14 8 14 Q13 14 13 20" />
      <circle cx="16.5" cy="9" r="2.6" />
      <path d="M10.5 20 Q10.5 15.2 16.5 15.2 Q21.5 15.2 21.5 20" />
    </svg>
  );
}

export function MimuIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 8 A4 4 0 0 1 8 4 H16 A4 4 0 0 1 20 8 V12 A4 4 0 0 1 16 16 H10 L6 19 V16 H8 A4 4 0 0 1 4 12 Z" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 5 V19 M5 12 H19" />
    </svg>
  );
}

export function BackIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M15 19 L8 12 L15 5" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 4 C9.2 4 7 6.2 7 9 V13 L5 16 H19 L17 13 V9 C17 6.2 14.8 4 12 4 Z" />
      <path d="M10 18 A2 2 0 0 0 14 18" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20 L16.5 16.5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 12 L9 17 L20 6" />
    </svg>
  );
}
