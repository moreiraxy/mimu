"use client";

import { useEffect } from "react";
import { ehAppIOSNoNavegador } from "@/lib/plataforma";

/**
 * Liga o plugin nativo em `window.MimuIAP`.
 *
 * O Swift em `ios-plugin/MimuIAP` existe do lado nativo, mas ele não se
 * apresenta sozinho ao JavaScript: alguém precisa chamar `registerPlugin` do
 * Capacitor e pendurar o resultado onde `lib/iap.ts` procura. Sem esta peça o
 * plugin compila, roda, e a tela conclui — corretamente — que não há caminho
 * de compra, porque `window.MimuIAP` continua `undefined`.
 *
 * O IMPORT É DINÂMICO, e só dentro do app iOS. `@capacitor/core` não tem nada
 * a fazer no bundle de quem abre a Mimu pelo navegador, que é a maioria — e
 * este app já paga caro por JavaScript que chega antes da primeira pintura.
 *
 * Falhar aqui é silencioso de propósito: sem a ponte, a tela de plano
 * simplesmente não oferece o botão de assinar, que é melhor do que oferecer um
 * que não funciona.
 */
export function PonteIAP() {
  useEffect(() => {
    if (!ehAppIOSNoNavegador()) return;
    if (window.MimuIAP) return;

    let cancelado = false;

    import("@capacitor/core")
      .then(({ registerPlugin }) => {
        if (cancelado) return;
        window.MimuIAP = registerPlugin("MimuIAP");
      })
      .catch(() => {
        // App antigo, sem o plugin embarcado. `caminhoDeCompra()` devolve
        // "indisponivel" e a tela se ajusta sozinha.
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return null;
}
