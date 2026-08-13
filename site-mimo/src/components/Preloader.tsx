import { useEffect, useState } from "react";
import { MimuIcon } from "./Logo";

/** cubic-bezier com leve overshoot — o ícone "chega" com um pequeno bounce. */
const EASE_BOUNCE = "cubic-bezier(0.34, 1.56, 0.64, 1)";
/** Mesma curva simétrica do resto do site, aqui na saída (fade + scale). */
const EASE_SAIDA = "cubic-bezier(0.76, 0, 0.24, 1)";

type Estagio = "icone" | "wordmark" | "linha" | "saindo";

/**
 * Intro de carregamento, estilo Desenrolai/Shiftbrain: tela cheia preta,
 * ícone entra com bounce, wordmark desliza ao lado, uma linha verde cresce
 * embaixo, e a tela se afasta (fade + scale 1→1.05) revelando o site. Roda
 * em toda carga de página — sem `sessionStorage`, de propósito: é a intro,
 * não um aviso único.
 *
 * A sequência é dirigida por `setTimeout`, não por `onTransitionEnd`: cada
 * fase tem uma duração conhecida (abaixo), e encadear por tempo evita que um
 * frame perdido em qualquer transição trave o resto da sequência.
 */
export function Preloader() {
  const [visivel, setVisivel] = useState(true);
  const [estagio, setEstagio] = useState<Estagio>("icone");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisivel(false);
      return;
    }

    document.body.style.overflow = "hidden";
    // O Lenis controla o scroll por fora do documento (transform, não
    // scrollTop) — só travar `overflow` no body não impede o wheel/touch de
    // rolar a página por baixo da intro. `window.__lenis` é exposto pelo
    // useSmoothScroll só pra esse controle entre componentes.
    window.__lenis?.stop();

    const timers = [
      setTimeout(() => setEstagio("wordmark"), 500),
      setTimeout(() => setEstagio("linha"), 1200),
      setTimeout(() => setEstagio("saindo"), 2000),
      setTimeout(() => {
        setVisivel(false);
        document.body.style.overflow = "";
        window.__lenis?.start();
      }, 2900),
    ];

    return () => {
      timers.forEach(clearTimeout);
      document.body.style.overflow = "";
      window.__lenis?.start();
    };
  }, []);

  if (!visivel) return null;

  const iconeDentro = estagio !== "icone";
  const wordmarkDentro = estagio === "wordmark" || estagio === "linha" || estagio === "saindo";
  const linhaCresceu = estagio === "linha" || estagio === "saindo";
  const saindo = estagio === "saindo";

  return (
    <div
      // `overflow-hidden` aqui é o que impede o `scale(1.05)` da saída de
      // empurrar a tela pros lados: um `fixed inset-0` escalado passa das
      // bordas da janela e vira transbordo horizontal.
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden bg-bg"
      style={{
        opacity: saindo ? 0 : 1,
        transform: saindo ? "scale(1.05)" : "scale(1)",
        transition: saindo ? `opacity 0.8s ${EASE_SAIDA}, transform 0.8s ${EASE_SAIDA}` : undefined,
      }}
      aria-hidden="true"
    >
      <div
        className="flex items-center gap-4"
        style={{
          opacity: iconeDentro ? 1 : 0,
          transform: iconeDentro ? "scale(1)" : "scale(0.6)",
          transition: `opacity 0.6s ${EASE_BOUNCE}, transform 0.6s ${EASE_BOUNCE}`,
        }}
      >
        <MimuIcon className="size-16 rounded-[16px]" />
        <span
          className="font-brand text-[56px] leading-none text-white"
          style={{
            opacity: wordmarkDentro ? 1 : 0,
            transform: wordmarkDentro ? "translateX(0)" : "translateX(-10px)",
            transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
          }}
        >
          mimu
        </span>
      </div>

      <div
        className="mt-6 h-[2px] max-w-[280px] bg-coral"
        style={{
          width: linhaCresceu ? "280px" : "0px",
          transition: "width 0.4s ease-in-out",
        }}
      />
    </div>
  );
}
