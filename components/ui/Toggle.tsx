"use client";

import { cn } from "@/lib/utils";

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  /**
   * Desligado de verdade, e não só pálido.
   *
   * Um interruptor que se move e não faz nada é pior do que um que não se
   * move: ele responde ao toque, então a pessoa acredita que ligou.
   */
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative flex h-[26px] w-11 flex-shrink-0 items-center rounded-full p-0.5 transition-colors duration-200",
        checked ? "bg-primary" : "bg-neutro-border",
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <span
        className={cn(
          "h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none",
          checked ? "translate-x-[18px]" : "translate-x-0",
        )}
      />
    </button>
  );
}
