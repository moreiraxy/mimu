import { cn } from "@/lib/utils";

/**
 * Bloco de loading com shimmer nas cores da Mimu. Nunca usar spinner
 * genérico — todo estado de carregamento do app usa esse componente.
 *
 * O gradiente sai de variáveis CSS e não de hex fixo: antes eram dois tons de
 * rosa escritos à mão, que sobreviveram à troca de paleta e deixavam a tela
 * de carregamento rosa num app verde. Agora acompanha o tema sozinho, e some
 * o risco de a próxima mudança de cor esquecer este arquivo.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-shimmer rounded-button bg-primary-light", className)}
      style={{
        backgroundImage:
          "linear-gradient(90deg, rgb(var(--primary-light)) 25%, rgb(var(--primary-border)) 37%, rgb(var(--primary-light)) 63%)",
        backgroundSize: "400% 100%",
      }}
    />
  );
}
