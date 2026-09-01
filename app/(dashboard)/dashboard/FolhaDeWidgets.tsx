"use client";

import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { useMountedTransition } from "@/hooks/useMountedTransition";
import { CATALOGO, type IdWidget } from "@/lib/widgets";
import { cn } from "@/lib/utils";

const DURACAO_SAIDA = 240;

/**
 * A gaveta de widgets disponíveis.
 *
 * Mostra só o que a conta PODE ter e ainda NÃO tem: oferecer um widget que já
 * está na tela faz a pessoa adicioná-lo duas vezes e depois procurar como
 * desfazer, e oferecer um de um módulo que ela não assina é anunciar uma porta
 * que não abre.
 *
 * Quando não sobra nada, a folha diz isso em vez de abrir vazia — folha vazia
 * parece defeito.
 */
export function FolhaDeWidgets({
  aberta,
  aoFechar,
  modulos,
  jaNoPainel,
  aoAdicionar,
}: {
  aberta: boolean;
  aoFechar: () => void;
  modulos: readonly string[];
  jaNoPainel: IdWidget[];
  aoAdicionar: (id: IdWidget) => void;
}) {
  const { rendered, visible } = useMountedTransition(aberta, DURACAO_SAIDA);
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberta) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);
    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    painelRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAntes;
    };
  }, [aberta, aoFechar]);

  if (!rendered) return null;

  const disponiveis = CATALOGO.filter(
    (w) =>
      !jaNoPainel.includes(w.id) &&
      (w.modulo === null || modulos.includes(w.modulo)),
  );

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Adicionar widget">
      <div
        aria-hidden="true"
        onClick={aoFechar}
        className={cn(
          "absolute inset-0 bg-black/65 transition-opacity duration-200 motion-reduce:transition-none",
          visible ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={painelRef}
        tabIndex={-1}
        className={cn(
          "absolute inset-x-0 bottom-0 outline-none",
          "transition-transform duration-[240ms] ease-out motion-reduce:transition-none",
          visible ? "translate-y-0" : "translate-y-full",
        )}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <div className="mx-auto flex max-w-[430px] flex-col gap-2.5 px-3">
          <div className="flex justify-center pb-1">
            <span aria-hidden="true" className="h-1 w-9 rounded-full bg-white/30" />
          </div>

          {disponiveis.length === 0 ? (
            <p className="vidro rounded-[18px] px-4 py-5 text-center text-[15px] text-neutro-muted">
              Todos os widgets disponíveis já estão no seu painel.
            </p>
          ) : (
            disponiveis.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => aoAdicionar(w.id)}
                className="vidro flex items-center gap-3 rounded-[18px] px-4 py-3.5 text-left transition-transform active:scale-[0.99]"
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary-forte">
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-escuro">
                    {w.nome}
                  </span>
                  <span className="block text-[13px] leading-snug text-neutro-muted">
                    {w.descricao}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
