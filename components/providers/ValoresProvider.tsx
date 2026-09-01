"use client";

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import { gravarEscondidos, lerEscondidos } from "@/lib/valores";

export interface ValoresContextValue {
  escondidos: boolean;
  alternar: () => void;
  /** false até o navegador ter respondido qual é a preferência — ver o Valor. */
  pronto: boolean;
}

export const ValoresContext = createContext<ValoresContextValue | undefined>(
  undefined,
);

export function ValoresProvider({ children }: { children: ReactNode }) {
  const [escondidos, setEscondidos] = useState(false);
  const [pronto, setPronto] = useState(false);

  /*
   * A leitura acontece num efeito, e não no estado inicial, de propósito.
   *
   * `localStorage` não existe no servidor, então o HTML que o servidor manda
   * nunca sabe a preferência. Ler no estado inicial faria o cliente renderizar
   * diferente do servidor na hidratação, que é o erro que o React reclama e
   * conserta apagando e redesenhando a árvore.
   *
   * O preço seria um piscar dos valores reais antes de esconder — justamente
   * na abertura, que é quando o cliente está na frente da dona. Quem cobre
   * esse instante é o script inline do layout, que marca o <html> antes da
   * primeira pintura, junto com a regra de CSS em globals.css. `pronto` é o
   * sinal de que o React já assumiu e a regra pode sair de cena.
   */
  useEffect(() => {
    setEscondidos(lerEscondidos());
    setPronto(true);
  }, []);

  const alternar = useCallback(() => {
    setEscondidos((atual) => {
      const novo = !atual;
      gravarEscondidos(novo);
      document.documentElement.dataset.valores = novo ? "escondidos" : "";
      return novo;
    });
  }, []);

  return (
    <ValoresContext.Provider value={{ escondidos, alternar, pronto }}>
      {children}
    </ValoresContext.Provider>
  );
}
