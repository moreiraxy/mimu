"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMountedTransition } from "@/hooks/useMountedTransition";
import { acoesLiberadas } from "@/components/dashboard/acoesRapidas";
import { cn } from "@/lib/utils";

const DURACAO_SAIDA = 240;

/**
 * A folha de ações, que sobe de baixo quando se toca no "+" da barra.
 *
 * Substitui o leque do FAB antigo, que abria os itens empilhados no ar sobre
 * a página. O leque tinha dois problemas que a folha não tem: os botões
 * ficavam soltos sobre o conteúdo (sem superfície própria, era preciso
 * adivinhar onde terminava um e começava o outro) e o alvo de toque de cada
 * um era do tamanho do texto, encostado na borda da tela.
 *
 * Aqui cada ação é uma linha larga sobre superfície de vidro, na parte de
 * baixo da tela — que é onde o polegar está quando ele acabou de tocar no
 * "+".
 */
export function FolhaAcoes({
  aberta,
  aoFechar,
  modulos,
}: {
  aberta: boolean;
  aoFechar: () => void;
  modulos: readonly string[];
}) {
  const router = useRouter();
  const { rendered, visible } = useMountedTransition(aberta, DURACAO_SAIDA);
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberta) return;

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);

    // Trava o fundo: sem isso a página atrás desliza junto com o dedo e a
    // folha parece estar solta em cima de nada.
    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    painelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAntes;
    };
  }, [aberta, aoFechar]);

  if (!rendered) return null;

  const acoes = acoesLiberadas(modulos);
  if (acoes.length === 0) return null;

  function ir(href: string) {
    aoFechar();
    router.push(href);
  }

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Nova ação">
      <div
        aria-hidden="true"
        onClick={aoFechar}
        className={cn(
          // Escurece mais que o padrão porque os cartões da folha são de VIDRO:
          // eles deixam passar o que está atrás, e sobre um gráfico claro o
          // rótulo da opção começa a competir com a página. O escurecimento é
          // o que devolve a leitura sem tirar a translucidez.
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
        <div className="mx-auto max-w-[430px] px-3">
          <div className="vidro overflow-hidden rounded-[28px] p-2 shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.5)]">
            {/* Puxador: a pista de que a folha se fecha arrastando pra baixo. */}
            <div className="flex justify-center py-2">
              <span aria-hidden="true" className="h-1 w-9 rounded-full bg-neutro-muted/50" />
            </div>

            {acoes.map((acao) => (
              <button
                key={acao.href}
                type="button"
                onClick={() => ir(acao.href)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-3.5 text-left transition-colors active:bg-neutro-disabled"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-primary-forte">
                  <acao.icone className="h-[18px] w-[18px]" strokeWidth={2.25} />
                </span>
                <span className="text-[15px] font-semibold text-escuro">
                  {acao.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
