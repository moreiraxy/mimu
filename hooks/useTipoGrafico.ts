"use client";

import { useCallback, useEffect, useState } from "react";

export type TipoGrafico = "linha" | "barra";

const CHAVE = "mimu:tipo-grafico";

/**
 * Linha ou barra, na escolha de quem usa.
 *
 * A preferência é do APARELHO e não da conta: é sobre como a pessoa gosta de
 * ler um gráfico na tela que ela tem na mão, e não sobre o negócio. Guardar no
 * banco levaria a escolha do celular para o computador, onde a tela é outra.
 *
 * Começa em "linha" porque é a forma da referência, e porque numa série de 31
 * dias trinta e uma colunas viram um pente.
 */
export function useTipoGrafico() {
  const [tipo, setTipo] = useState<TipoGrafico>("linha");

  useEffect(() => {
    try {
      const guardado = window.localStorage.getItem(CHAVE);
      if (guardado === "linha" || guardado === "barra") setTipo(guardado);
    } catch {
      // Armazenamento bloqueado: vale o padrão, sem quebrar a tela.
    }
  }, []);

  const alternar = useCallback(() => {
    setTipo((atual) => {
      const novo: TipoGrafico = atual === "linha" ? "barra" : "linha";
      try {
        window.localStorage.setItem(CHAVE, novo);
      } catch {
        // Sem armazenamento a escolha vale só nesta sessão.
      }
      return novo;
    });
  }, []);

  return { tipo, alternar };
}
