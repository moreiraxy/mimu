
          (function () {
            "use strict";

            // Função para inicializar efeitos ao carregar a página
            function initEffects() {
              // Detecta todos os elementos com atributo 'effect'
              const effectElements = document.querySelectorAll("[effect]");

              effectElements.forEach((element) => {
                // Aqui você pode adicionar lógica adicional se necessário
                // Por enquanto, os efeitos CSS já são aplicados automaticamente
              });
            }

            // Inicializa quando o DOM estiver pronto
            if (document.readyState === "loading") {
              document.addEventListener("DOMContentLoaded", initEffects);
            } else {
              initEffects();
            }

            // Opcional: Observador para elementos adicionados dinamicamente
            function observeNewElements() {
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.hasAttribute("effect")) {
                    }
                  });
                });
              });

              observer.observe(document.body, {
                childList: true,
                subtree: true,
              });
            }

            // Ativa observador após carregar
            if (document.readyState === "loading") {
              document.addEventListener("DOMContentLoaded", observeNewElements);
            } else {
              observeNewElements();
            }
          })();
        