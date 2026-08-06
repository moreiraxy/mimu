"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function CheckBadge() {
  return (
    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-coral text-white">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 12 L9 17 L20 6"
          stroke="white"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function OptionCard({
  selected,
  onClick,
  icon: Icon,
  label,
  description,
  showCheck = false,
}: {
  selected: boolean;
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  description?: string;
  showCheck?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex gap-3 rounded-card border p-4 text-left transition-colors",
        description
          ? "flex-row items-center"
          : "flex-col items-center p-5 text-center",
        selected
          ? "border-coral bg-coral-light"
          : "border-neutro-border bg-superficie hover:border-coral/40",
      )}
    >
      <Icon
        className={cn(
          "flex-shrink-0",
          description ? "h-6 w-6" : "h-7 w-7",
          selected ? "text-coral" : "text-neutro-muted-strong",
        )}
        strokeWidth={2}
      />
      <span className={description ? "flex-1" : undefined}>
        <span className="block text-sm font-semibold text-escuro">
          {label}
        </span>
        {description && (
          <span className="block text-xs text-neutro-muted">
            {description}
          </span>
        )}
      </span>
      {showCheck && selected && <CheckBadge />}
    </button>
  );
}
