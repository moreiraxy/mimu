/* Gerado por tools/gen-app.mjs a partir do <script> inline #05
   do clone estatico. Preenche [data-dynamic-year] com o ano atual.
   ADAPTADO: o codigo original estava dentro de
   document.addEventListener("DOMContentLoaded", ...). Esse evento ja
   disparou quando o React hidrata, entao o embrulho foi removido e o
   corpo roda direto no useEffect. Logica interna intacta.
   Nao editar a mao: ajuste tools/gen-app.mjs e regenere. */

// @ts-nocheck -- codigo do site original, preservado sem tipagem
'use client';

import { useEffect } from 'react';

export default function DynamicYear() {
  useEffect(() => {
    document.querySelectorAll("[data-dynamic-year]").forEach(function (el) {
                    el.textContent = new Date().getFullYear();
                  });
  }, []);

  return null;
}
