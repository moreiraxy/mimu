/* Gerado por tools/gen-app.mjs a partir do <script> inline #00
   do clone estatico. Fecha o banner do nav e trata o link de skip.
   Codigo preservado 1:1; apenas movido para dentro de um useEffect.
   Nao editar a mao: ajuste tools/gen-app.mjs e regenere. */

// @ts-nocheck -- codigo do site original, preservado sem tipagem
'use client';

import { useEffect } from 'react';

export default function NavBanner() {
  useEffect(() => {
    if (sessionStorage.getItem("hide-nav-banner") === "true") {
                  document.documentElement.classList.add("hide-nav-banner");
                }
                document.addEventListener("DOMContentLoaded", function () {
                  document.querySelectorAll(".nav_banner_close_wrap").forEach((button) => {
                    button.addEventListener("click", function () {
                      sessionStorage.setItem("hide-nav-banner", "true");
                      document.documentElement.classList.add("hide-nav-banner");
                    });
                  });
                  document.querySelectorAll(".nav_skip_wrap").forEach(function (link) {
                    const target = document.querySelector("main");
                    if (!target) return;
                    link.addEventListener("click", function () {
                      target.setAttribute("tabindex", "-1");
                      target.focus();
                    });
                  });
                });
  }, []);

  return null;
}
