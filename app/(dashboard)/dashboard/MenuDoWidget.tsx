"use client";

import { useEffect, useRef } from "react";
import { EyeOff, Pencil, Trash2 } from "lucide-react";
import { useMountedTransition } from "@/hooks/useMountedTransition";
import { cn } from "@/lib/utils";
import type { TamanhoWidget } from "@/lib/widgets";

const DURACAO_SAIDA = 180;

/**
 * O menu que abre ao SEGURAR um widget.
 *
 * É o gesto que a referência usa, e é o mesmo da tela de início do iPhone: não
 * há botão de editar em lugar nenhum, e não precisa haver — quem quer mexer no
 * widget segura o widget. O aprendizado vem de fora do app.
 *
 * O menu traz o que se pode fazer COM AQUELE widget (esconder os valores,
 * entrar no modo de edição, remover) e, embaixo, os tamanhos que ele aceita.
 * Os tamanhos ficam numa fileira de ícones e não numa lista de palavras porque
 * a forma do ícone JÁ é a resposta: um quadrado pequeno, um retângulo deitado,
 * um retângulo alto.
 */
export function MenuDoWidget({
  aberto,
  aoFechar,
  tamanhoAtual,
  tamanhos,
  aoTrocarTamanho,
  aoRemover,
  aoEditar,
  aoOcultar,
  ancora,
}: {
  aberto: boolean;
  aoFechar: () => void;
  tamanhoAtual: TamanhoWidget;
  tamanhos: TamanhoWidget[];
  aoTrocarTamanho: (t: TamanhoWidget) => void;
  aoRemover: () => void;
  aoEditar: () => void;
  aoOcultar: () => void;
  /** Onde o dedo tocou, para o menu nascer perto dali. */
  ancora: { x: number; y: number } | null;
}) {
  const { rendered, visible } = useMountedTransition(aberto, DURACAO_SAIDA);
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    painelRef.current?.focus();
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto, aoFechar]);

  if (!rendered || !ancora) return null;

  /*
   * O menu tem 240px de largura e nasce centrado no toque, mas nunca sai da
   * tela: sem essa trava, segurar um widget encostado na borda abriria metade
   * do menu para fora e os tamanhos ficariam inalcançáveis.
   */
  const LARGURA = 240;
  const margem = 12;
  const x = Math.min(
    Math.max(ancora.x - LARGURA / 2, margem),
    (typeof window !== "undefined" ? window.innerWidth : 390) - LARGURA - margem,
  );

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Opções do widget">
      <div
        aria-hidden="true"
        onClick={aoFechar}
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-150 motion-reduce:transition-none",
          visible ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={painelRef}
        tabIndex={-1}
        style={{ left: x, top: Math.max(ancora.y, 80), width: LARGURA }}
        className={cn(
          "vidro absolute overflow-hidden rounded-[22px] p-1.5 outline-none",
          "origin-top transition-[opacity,transform] duration-150 ease-out motion-reduce:transition-none",
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0",
        )}
      >
        <Opcao icone={EyeOff} rotulo="Ocultar dados" aoTocar={aoOcultar} />
        <Opcao icone={Pencil} rotulo="Editar widgets" aoTocar={aoEditar} />
        <Opcao icone={Trash2} rotulo="Remover" perigo aoTocar={aoRemover} />

        {tamanhos.length > 1 && (
          <div className="mt-1.5 flex items-center justify-center gap-2 border-t border-escuro/10 pt-2.5">
            {tamanhos.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => aoTrocarTamanho(t)}
                aria-label={`Tamanho ${t}`}
                aria-pressed={t === tamanhoAtual}
                className={cn(
                  "flex h-10 w-12 items-center justify-center rounded-xl transition-colors",
                  t === tamanhoAtual
                    ? "bg-primary/20 text-primary-forte"
                    : "text-neutro-muted",
                )}
              >
                <FormaDoTamanho tamanho={t} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Opcao({
  icone: Icone,
  rotulo,
  aoTocar,
  perigo = false,
}: {
  icone: typeof EyeOff;
  rotulo: string;
  aoTocar: () => void;
  perigo?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={aoTocar}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[15px] font-semibold transition-colors active:bg-escuro/10",
        perigo ? "text-erro-texto" : "text-escuro",
      )}
    >
      <Icone className="h-[18px] w-[18px]" strokeWidth={2} />
      {rotulo}
    </button>
  );
}

/** O ícone de cada tamanho: a própria proporção da caixa que ele produz. */
function FormaDoTamanho({ tamanho }: { tamanho: TamanhoWidget }) {
  const forma =
    tamanho === "pequeno"
      ? "h-4 w-4"
      : tamanho === "medio"
        ? "h-3.5 w-6"
        : "h-5 w-6";
  return (
    <span
      className={cn("rounded-[4px] border-2 border-current", forma)}
      aria-hidden="true"
    />
  );
}
