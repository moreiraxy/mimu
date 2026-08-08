
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
              image: "assets/img/69de851ac0c00e1ce20499df_pierre-logo_white.svg",

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
    