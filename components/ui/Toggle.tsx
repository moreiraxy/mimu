"use client";

import { cn } from "@/lib/utils";

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative flex h-[26px] w-11 flex-shrink-0 items-center rounded-full p-0.5 transition-colors duration-200",
        checked ? "bg-coral" : "bg-neutro-border",
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
