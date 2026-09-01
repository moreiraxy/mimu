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

/**
 * As palavrinhas de ligação não viram inicial.
 *
 * "Salão da Rayssa" dava "SD" — a inicial de "da". Nomes de negócio brasileiros
 * são cheios delas ("Bar do Zé", "Casa das Massas"), e o resultado era um
 * monograma que não lembra nada de quem o lê.
 */
const LIGACOES = new Set(["da", "de", "do", "das", "dos", "e", "em", "no", "na"]);

function iniciaisDoNome(nome: string): string {
  const palavras = nome.split(" ").filter(Boolean);
  const significativas = palavras.filter(
    (p) => !LIGACOES.has(p.toLowerCase()),
  );

  const iniciais = (significativas.length > 0 ? significativas : palavras)
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
  // O retrato do topo do perfil. Grande porque ali ele é o assunto da tela,
  // e não um marcador ao lado de um nome numa lista.
  xl: "h-24 w-24 text-3xl",
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
