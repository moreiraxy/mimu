/* Gerado por tools/gen-app.mjs a partir do <script> inline #07
   do clone estatico. Renderiza o QR code de download no rodape.
   Codigo preservado 1:1; apenas movido para dentro de um useEffect.
   Nao editar a mao: ajuste tools/gen-app.mjs e regenere. */

// @ts-nocheck -- codigo do site original, preservado sem tipagem
'use client';

import { useEffect } from 'react';

export default function QrCode() {
  useEffect(() => {
    /* Renderiza o QR code de download do app.
         Original: gerava um deep link OneLink por visitante via AppsFlyer +
         RudderStack. Sem o tracking, usamos a URL de fallback do proprio site,
         preservando estilo, tamanho e logo central identicos. */
          (function () {
            "use strict";

            var DOWNLOAD_URL = "https://pierre.onelink.me/9nSN/ez0obruc";

            function renderQRCode(url) {
              var containers = document.querySelectorAll(".pierre-qr-code");
              if (!containers.length || typeof QRCodeStyling === "undefined") return;

              Array.prototype.forEach.call(containers, function (container) {
                container.innerHTML = "";
                var size = container.offsetWidth || 176;

                new QRCodeStyling({
                  width: size,
                  height: size,
                  type: "svg", // melhor pra qualidade
                  data: url,

                  // imagem no centro
                  image: "assets/img/mimu-icon.svg",

                  dotsOptions: {
                    type: "rounded",
                    color: "#ffffff",
                  },
                  cornersSquareOptions: {
                    type: "extra-rounded",
                    color: "#ffffff",
                  },
                  cornersDotOptions: {
                    type: "dot",
                    color: "#ffffff",
                  },
                  backgroundOptions: {
                    color: "#ffffff00",
                  },

                  imageOptions: {
                    crossOrigin: "anonymous",
                    margin: 6, // espaco ao redor da logo
                    imageSize: 0.25, // tamanho da logo (0.2-0.3 ideal)
                    hideBackgroundDots: true,
                  },
                }).append(container);
              });
            }

            function bindDownloadButtons() {
              document.querySelectorAll("[data-onelink]").forEach(function (el) {
                if (el.tagName === "A") el.setAttribute("href", DOWNLOAD_URL);
              });
            }

            function init() {
              bindDownloadButtons();
              renderQRCode(DOWNLOAD_URL);
            }

            if (document.readyState === "loading") {
              document.addEventListener("DOMContentLoaded", init);
            } else {
              init();
            }
          })();
  }, []);

  return null;
}
