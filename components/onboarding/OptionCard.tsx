"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function CheckBadge() {
  return (
    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-text">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 12 L9 17 L20 6"
          stroke="#0A0A0A"
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
      /*
        O ACESO É O VÉU DA MARCA, o mesmo "ligado" do resto do app.
        Era `bg-primary-light`: um bloco claro chapado no tema escuro, e ainda
        o único da tela — a opção escolhida virava a coisa mais berrante da
        página, quando o que ela precisa dizer é só "é esta".
      */
      className={cn(
        "flex gap-3 rounded-[18px] p-4 text-left transition-colors",
        description
          ? "flex-row items-center"
          : "flex-col items-center p-5 text-center",
        selected ? "bg-primary/20" : "vidro-card",
      )}
    >
      <Icon
        className={cn(
          "flex-shrink-0",
          description ? "h-6 w-6" : "h-7 w-7",
          selected ? "text-primary-forte" : "text-neutro-muted",
        )}
        strokeWidth={2}
      />
      <span className={description ? "flex-1" : undefined}>
        <span
          className={cn(
            "block text-[15px] font-bold",
            selected ? "text-primary-forte" : "text-escuro",
          )}
        >
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block text-[13px] text-neutro-muted">
            {description}
          </span>
        )}
      </span>
      {showCheck && selected && <CheckBadge />}
    </button>
  );
}
