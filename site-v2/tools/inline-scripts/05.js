
            document.addEventListener("DOMContentLoaded", function () {
              document.querySelectorAll("[data-dynamic-year]").forEach(function (el) {
                el.textContent = new Date().getFullYear();
              });
            });
          