"use client";

import { cn } from "@/lib/utils";

/*
 * O chip selecionado usa `text-fundo` e NÃO `text-white`.
 *
 * `escuro` é o token do texto principal, e ele inverte com o tema: quase preto
 * no claro, branco no escuro. Como fundo do chip aceso, isso significa que no
 * tema escuro o chip fica branco. Com `text-white` por cima, o rótulo era
 * branco sobre branco: a pílula aparecia vazia na tela.
 *
 * `fundo` é o token do fundo da página, e inverte junto na direção contrária,
 * então serve aos dois temas sem condicional.
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
          "flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
          ativa === null
            ? "border-escuro bg-escuro text-fundo"
            : "border-neutro-border bg-superficie text-escuro",
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
            "flex-shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors",
            ativa === categoria
              ? "border-escuro bg-escuro text-fundo"
              : "border-neutro-border bg-superficie text-escuro",
          )}
        >
          {categoria}
        </button>
      ))}
    </div>
  );
}
