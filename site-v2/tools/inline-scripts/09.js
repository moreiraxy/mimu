
      (function () {
        var THRESHOLD = 0.5;
        var ATTR = "data-animate-on-view";

        var style = document.createElement("style");
        style.textContent = "[" + ATTR + "]:not(.aov-ready) { visibility: hidden; }";
        document.head.appendChild(style);

        function bustCache(url) {
          var sep = url.indexOf("?") === -1 ? "?" : "&";
          return url + sep + "aov=" + Date.now();
        }

        var observer = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;

              var el = entry.target;
              var originalSrc = el.getAttribute("data-original-src");

              if (originalSrc) {
                el.src = bustCache(originalSrc);
                el.removeAttribute("data-original-src");
              }

              var sources = el.querySelectorAll("source[data-original-src]");
              sources.forEach(function (source) {
                source.src = bustCache(source.getAttribute("data-original-src"));
                source.removeAttribute("data-original-src");
              });

              if (el.tagName === "VIDEO") {
                el.load();
                if (!el.hasAttribute("autoplay")) el.play();
              }

              el.classList.add("aov-ready");
              observer.unobserve(el);
            });
          },
          { threshold: THRESHOLD },
        );

        function init() {
          var elements = document.querySelectorAll("[" + ATTR + "]");

          elements.forEach(function (el) {
            var src = el.getAttribute("src");
            if (src) {
              el.setAttribute("data-original-src", src);
              el.removeAttribute("src");
            }

            var sources = el.querySelectorAll("source[src]");
            sources.forEach(function (source) {
              source.setAttribute("data-original-src", source.src);
              source.removeAttribute("src");
            });

            observer.observe(el);
          });
        }

        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", init);
        } else {
          init();
        }
      })();
    