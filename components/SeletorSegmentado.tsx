"use client";

import { cn } from "@/lib/utils";

/**
 * O seletor de recorte do app — "Dia/Semana/Mês", "7d/30d", "1s/1m/6m/1a".
 *
 * Existe como componente porque a mesma peça estava desenhada de três jeitos
 * diferentes em três telas, e nenhum deles era a linguagem do app: todos usavam
 * `bg-escuro text-fundo` no item aceso, que é um retângulo CHAPADO no meio de
 * superfícies translúcidas — o mesmo erro que a gente já corrigiu nos cartões.
 *
 * O aceso agora é o mesmo da barra de baixo: um véu da cor da marca com o texto
 * em néon. É a única forma de "ligado" que o app tem, e ela vale em todo lugar.
 */
export function SeletorSegmentado<T extends string>({
  opcoes,
  valor,
  onChange,
  fundo = "vidro",
  className,
}: {
  opcoes: { id: T; label: string }[];
  valor: T;
  onChange: (id: T) => void;
  /**
   * `vidro` para quando ele flutua sobre o papel de parede; `sutil` para
   * quando mora DENTRO de um cartão de vidro — vidro sobre vidro dobra o
   * desfoque e a peça de dentro fica leitosa.
   */
  fundo?: "vidro" | "sutil";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex gap-1 rounded-full p-1",
        fundo === "vidro" ? "vidro-card" : "bg-escuro/[0.06]",
        className,
      )}
    >
      {opcoes.map((opcao) => (
        <button
          key={opcao.id}
          type="button"
          onClick={() => onChange(opcao.id)}
          aria-pressed={valor === opcao.id}
          className={cn(
            "flex-1 whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors",
            valor === opcao.id
              ? "bg-primary/20 text-primary-forte"
              : "text-neutro-muted",
          )}
        >
          {opcao.label}
        </button>
      ))}
    </div>
  );
}
