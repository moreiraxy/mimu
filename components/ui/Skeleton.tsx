import { cn } from "@/lib/utils";

/**
 * Bloco de loading com shimmer nas cores da Mimu. Nunca usar spinner
 * genérico — todo estado de carregamento do app usa esse componente.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-shimmer rounded-button bg-coral-light", className)}
      style={{
        backgroundImage:
          "linear-gradient(90deg, #FFF5F4 25%, #FFE0DB 37%, #FFF5F4 63%)",
        backgroundSize: "400% 100%",
      }}
    />
  );
}
