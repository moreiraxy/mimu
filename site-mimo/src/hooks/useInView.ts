import { useEffect, useRef, useState } from "react";

/**
 * Diz se o elemento está visível na tela.
 *
 * Por padrão REPETE: sai de vista, volta pra `false`; entra de novo, volta pra
 * `true` e a animação roda outra vez. É assim que o desenrol.ai se comporta —
 * a página não "gasta" as animações na primeira passada, então quem rola pra
 * cima e volta vê o movimento de novo.
 *
 * `umaVezSo` mantém o comportamento antigo (dispara e desconecta) pra quem
 * precisar — hoje ninguém usa, mas contagens de número e efeitos que só fazem
 * sentido uma vez são o caso típico.
 */
export function useInView<T extends HTMLElement>(
  rootMargin = "-10% 0px",
  umaVezSo = false,
) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Sem observer (ou com movimento reduzido) mostra tudo de uma vez.
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setInView(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (umaVezSo) io.disconnect();
        } else if (!umaVezSo) {
          setInView(false);
        }
      },
      { rootMargin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, umaVezSo]);

  return { ref, inView };
}
