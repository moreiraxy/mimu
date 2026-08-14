import { cn } from "@/lib/utils";

// Só usamos tons já existentes na paleta da marca (coral/verde/âmbar) — sem
// introduzir cores novas fora da identidade visual.
const PALETA_AVATAR = [
  { bg: "bg-primary-light", texto: "text-primary-forte" },
  { bg: "bg-verde-light", texto: "text-verde-texto" },
  { bg: "bg-ambar-light", texto: "text-ambar-texto" },
];

function corPorNome(nome: string) {
  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = (hash * 31 + nome.charCodeAt(i)) | 0;
  }
  return PALETA_AVATAR[Math.abs(hash) % PALETA_AVATAR.length]!;
}

function iniciaisDoNome(nome: string): string {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
  return iniciais || "?";
}

const TAMANHOS = {
  sm: "h-10 w-10 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
};

export function Avatar({
  nome,
  size = "md",
}: {
  nome: string;
  size?: keyof typeof TAMANHOS;
}) {
  const cor = corPorNome(nome);
  return (
    <div
      className={cn(
        "flex flex-shrink-0 items-center justify-center rounded-full font-bold",
        TAMANHOS[size],
        cor.bg,
        cor.texto,
      )}
    >
      {iniciaisDoNome(nome)}
    </div>
  );
}
