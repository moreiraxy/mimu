"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Fade sutil no primeiro mount — usado na troca de skeleton pro conteúdo
 * real. Frequência alta (roda em toda navegação entre telas), por isso é só
 * opacidade, rápido e sem deslocamento — nada que atrase a leitura do dado.
 */
export function FadeIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisivel(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={cn(
        "transition-opacity duration-150 ease-out motion-reduce:duration-75",
        visivel ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
