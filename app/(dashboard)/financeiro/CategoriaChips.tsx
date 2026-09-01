"use client";

import { cn } from "@/lib/utils";

/*
 * O chip aceso é o mesmo "ligado" da barra de baixo: véu da cor da marca, texto
 * em néon.
 *
 * Antes era o token do texto principal usado como PREENCHIMENTO — um retângulo
 * branco chapado no tema escuro, no meio de uma fila de pílulas de vidro. Além
 * de destoar, obrigava um comentário inteiro explicando por que o rótulo tinha
 * que ser a cor do fundo da página: com o fundo do chip invertendo junto com o
 * tema, qualquer cor fixa por cima ficava branca sobre branca em um dos dois. O
 * véu da marca resolve os dois temas sem condicional, porque néon não inverte.
 */


export function CategoriaChips({
  categorias,
  ativa,
  onChange,
}: {
  categorias: string[];
  ativa: string | null;
  onChange: (categoria: string | null) => void;
}) {
  if (categorias.length === 0) return null;

  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto scroll-fade-x px-4 pb-1">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "flex-shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
          ativa === null
            ? "bg-primary/20 text-primary-forte"
            : "vidro-card text-escuro",
        )}
      >
        Todas categorias
      </button>
      {categorias.map((categoria) => (
        <button
          key={categoria}
          type="button"
          onClick={() => onChange(categoria)}
          className={cn(
            "flex-shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
            ativa === categoria
              ? "bg-primary/20 text-primary-forte"
              : "vidro-card text-escuro",
          )}
        >
          {categoria}
        </button>
      ))}
    </div>
  );
}
