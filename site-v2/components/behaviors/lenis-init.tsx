/* Gerado por tools/gen-app.mjs a partir do <script> inline #08
   do clone estatico. Inicializa o scroll suave do Lenis.
   Codigo preservado 1:1; apenas movido para dentro de um useEffect.
   Nao editar a mao: ajuste tools/gen-app.mjs e regenere. */

// @ts-nocheck -- codigo do site original, preservado sem tipagem
'use client';

import { useEffect } from 'react';

export default function LenisInit() {
  useEffect(() => {
    // Initialize Lenis
          const lenis = new Lenis({
            autoRaf: true,
          });
  }, []);

  return null;
}
