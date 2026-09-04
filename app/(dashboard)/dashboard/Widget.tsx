"use client";

import { useRef } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { vibrar } from "@/lib/nativo";

const TEMPO_DE_SEGURAR = 450;

/**
 * A moldura de um widget: é ela que escuta o "segurar" e desenha o modo de
 * edição.
 *
 * O widget em si não sabe de nada disso — ele só desenha o conteúdo dele. Foi
 * de propósito: acrescentar um widget novo ao painel não pode obrigar a
 * reimplementar gesto, menu e remoção em cada um.
 *
 * `450ms` é o tempo do toque longo do iOS. Mais curto e um toque comum vira
 * menu por engano; mais longo e a pessoa desiste antes.
 *
 * O gesto é cancelado se o dedo ANDAR mais que 10px: sem isso, rolar a página
 * com o dedo pousado num widget abriria o menu no meio da rolagem.
 */
export function Widget({
  className,
  editando,
  podeSubir,
  podeDescer,
  aoSegurar,
  aoRemover,
  aoSubir,
  aoDescer,
  children,
}: {
  className?: string;
  editando: boolean;
  podeSubir: boolean;
  podeDescer: boolean;
  aoSegurar: (ponto: { x: number; y: number }) => void;
  aoRemover: () => void;
  aoSubir: () => void;
  aoDescer: () => void;
  children: React.ReactNode;
}) {
  const timer = useRef<number | null>(null);
  const inicio = useRef<{ x: number; y: number } | null>(null);

  function cancelar() {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    inicio.current = null;
  }

  return (
    <div
      className={cn("relative", className)}
      onPointerDown={(e) => {
        if (editando) return;
        inicio.current = { x: e.clientX, y: e.clientY };
        timer.current = window.setTimeout(() => {
          aoSegurar({ x: e.clientX, y: e.clientY });
          // Vibra ao abrir, como o sistema faz: é o sinal de que o gesto
          // pegou, sem precisar olhar. Passa por lib/nativo.ts porque
          // `navigator.vibrate` NÃO EXISTE no iOS — a chamada não dava erro,
          // simplesmente não fazia nada, e no aplicativo o menu abria sem
          // nenhuma confirmação no dedo.
          void vibrar();
          cancelar();
        }, TEMPO_DE_SEGURAR);
      }}
      onPointerMove={(e) => {
        if (!inicio.current) return;
        const andou =
          Math.abs(e.clientX - inicio.current.x) > 10 ||
          Math.abs(e.clientY - inicio.current.y) > 10;
        if (andou) cancelar();
      }}
      onPointerUp={cancelar}
      onPointerCancel={cancelar}
      onContextMenu={(e) => {
        // No computador o gesto equivalente é o botão direito.
        if (editando) return;
        e.preventDefault();
        aoSegurar({ x: e.clientX, y: e.clientY });
      }}
    >
      {/*
        O balanço da edição fica NUMA CAMADA SEPARADA do material.

        `transform: rotate` num ancestral quebra o `backdrop-filter` do que
        está dentro: o elemento passa a capturar nada e o widget fica chapado
        justo no modo em que a pessoa está olhando para ele.

        Por isso são dois elementos: este de fora recebe o giro, e o material
        vive no filho. `transform-gpu` mantém o giro na GPU sem promover a
        camada de baixo.
      */}
      <div className={cn("h-full", editando && "animate-balancar transform-gpu")}>
        {children}
      </div>

      {editando && (
        <>
          <button
            type="button"
            onClick={aoRemover}
            aria-label="Remover widget"
            className="absolute -left-1.5 -top-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-erro text-white shadow-lg"
          >
            <Minus className="h-4 w-4" strokeWidth={3} />
          </button>

          {/*
            Mover é por SETAS, e não arrastando.

            Arrastar é o gesto da Apple e é o que a referência faz. Aqui os
            widgets têm tamanhos diferentes na mesma grade (meia largura,
            largura inteira, alto), e um arrasto entre caixas de tamanhos
            diferentes erra o alvo com frequência — a peça cai no lugar errado
            e a pessoa tenta de novo. Setas acertam sempre. O arrasto entra
            quando eu tiver como fazê-lo confiável com a grade mista.
          */}
          <div className="absolute -right-1.5 -top-1.5 z-10 flex gap-1">
            {podeSubir && (
              <button
                type="button"
                onClick={aoSubir}
                aria-label="Mover para cima"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-escuro text-fundo shadow-lg"
              >
                <ArrowUp className="h-3.5 w-3.5" strokeWidth={3} />
              </button>
            )}
            {podeDescer && (
              <button
                type="button"
                onClick={aoDescer}
                aria-label="Mover para baixo"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-escuro text-fundo shadow-lg"
              >
                <ArrowDown className="h-3.5 w-3.5" strokeWidth={3} />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
