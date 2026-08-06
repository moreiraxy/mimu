"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { BackIcon } from "@/components/icons/NavIcons";

export function PageHeader({
  title,
  onBack,
  action,
}: {
  title: string;
  onBack?: () => void;
  action?: ReactNode;
}) {
  const router = useRouter();

  return (
    <header className="mb-4 flex items-center gap-2">
      <button
        type="button"
        onClick={onBack ?? (() => router.back())}
        aria-label="Voltar"
        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-escuro transition-colors hover:bg-neutro-disabled"
      >
        <BackIcon />
      </button>
      <h1 className="flex-1 truncate text-center text-base font-semibold text-escuro">
        {title}
      </h1>
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-end">
        {action}
      </div>
    </header>
  );
}
