import { useEffect } from "react";

/**
 * Portado de site-v2/components/behaviors/animate-on-view.tsx — reinicia
 * SVGs com animação própria (`@keyframes` embutido no arquivo) toda vez que
 * entram em tela, removendo e restaurando o `src` com cache-bust. Mesmo
 * algoritmo, como hook real em vez de script global.
 *
 * Uso: <img data-animate-on-view="true" src="..." />
 */
export function useAnimateOnView() {
  useEffect(() => {
    const THRESHOLD = 0.5;
    const ATTR = "data-animate-on-view";

    const style = document.createElement("style");
    style.textContent = `[${ATTR}]:not(.aov-ready) { visibility: hidden; }`;
    document.head.appendChild(style);

    function bustCache(url: string) {
      const sep = url.indexOf("?") === -1 ? "?" : "&";
      return `${url}${sep}aov=${Date.now()}`;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;

          const el = entry.target as HTMLImageElement | HTMLVideoElement;
          const originalSrc = el.getAttribute("data-original-src");

          if (originalSrc) {
            el.src = bustCache(originalSrc);
            el.removeAttribute("data-original-src");
          }

          const sources = el.querySelectorAll<HTMLSourceElement>("source[data-original-src]");
          sources.forEach((source) => {
            source.src = bustCache(source.getAttribute("data-original-src")!);
            source.removeAttribute("data-original-src");
          });

          if (el.tagName === "VIDEO") {
            const video = el as HTMLVideoElement;
            video.load();
            if (!video.hasAttribute("autoplay")) video.play();
          }

          el.classList.add("aov-ready");
          observer.unobserve(el);
        }
      },
      { threshold: THRESHOLD },
    );

    function init() {
      const elements = document.querySelectorAll<HTMLImageElement>(`[${ATTR}]`);

      elements.forEach((el) => {
        const src = el.getAttribute("src");
        if (src) {
          el.setAttribute("data-original-src", src);
          el.removeAttribute("src");
        }

        const sources = el.querySelectorAll<HTMLSourceElement>("source[src]");
        sources.forEach((source) => {
          source.setAttribute("data-original-src", source.src);
          source.removeAttribute("src");
        });

        observer.observe(el);
      });
    }

    init();

    return () => {
      observer.disconnect();
      style.remove();
    };
  }, []);
}
