"use client";

import { useEffect } from "react";
import { aoAbrirPorLink } from "@/lib/nativo";

/**
 * Liga o ouvinte de Universal Link.
 *
 * MORA NO LAYOUT RAIZ, e isso é a decisão inteira: a PonteIAP pode viver em
 * (dashboard) porque compra só acontece com alguém logado, mas o link de
 * confirmação de e-mail chega justamente para quem AINDA NÃO está — e essa
 * pessoa está na tela de começar, fora daquele grupo. Montado lá dentro, o
 * ouvinte não existiria exatamente no único momento em que ele importa.
 */
export function PonteLinks() {
  useEffect(() => {
    let desligar: (() => void) | undefined;
    let cancelado = false;

    void aoAbrirPorLink().then((f) => {
      if (cancelado) {
        f();
        return;
      }
      desligar = f;
    });

    return () => {
      cancelado = true;
      desligar?.();
    };
  }, []);

  return null;
}
