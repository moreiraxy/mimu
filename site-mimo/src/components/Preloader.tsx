import { useEffect, useRef, useState } from "react";
import { MimuIcon } from "./Logo";

/**
 * Intro de carregamento.
 *
 * A versão anterior durava 2,9s e era uma sequência solta: o ícone crescia, a
 * marca deslizava 10px (movimento pequeno demais para ser lido como
 * intenção), uma linha decorativa crescia até 280px sem significar nada, e no
 * fim tudo sumia com um fade. A página aparecia atrás sem nenhuma relação com
 * o que tinha acabado de acontecer.
 *
 * Esta versão troca a lógica: em vez de acabar, a intro ENTREGA. A marca é
 * medida contra a marca real do cabeçalho e voa até a posição exata dela
 * enquanto a cortina sobe. Quem assiste vê um movimento só, do centro da tela
 * até o canto onde o logo vive — e a página já está lá quando a cortina passa.
 *
 * Também é bem mais curta: 1,44s no total contra 2,9s. Intro longa cobra o
 * tempo de quem chegou, e cobra de novo a cada visita.
 */

/** Saída padrão do site: começa rápido e desacelera, sem balanço. */
const EASE_SAIDA = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Entrada com um respiro de overshoot, só na chegada da marca. */
const EASE_ENTRADA = "cubic-bezier(0.34, 1.4, 0.64, 1)";

const DURACAO = {
  /** Marca aparece no centro. */
  entrada: 420,
  /** Wordmark revelado por máscara, letra a letra da esquerda pra direita. */
  wordmark: 380,
  /**
   * O voo é mais curto que a cortina de propósito. Com os dois no mesmo
   * tempo, a cortina terminava muito antes (a curva é bem adiantada) e
   * sobrava meio segundo de um quadrado solto atravessando uma página já
   * revelada. Chegando primeiro, a marca encaixa no lugar dela e o resto da
   * cortina só termina de sair.
   */
  voo: 430,
  cortina: 640,
} as const;

/** Quanto tempo a intro fica na tela, do começo ao desmonte. */
const TOTAL = DURACAO.entrada + DURACAO.wordmark + DURACAO.cortina;

type Estagio = "entrando" | "assinatura" | "entregando" | "fim";

/** Onde a marca do cabeçalho está, em coordenadas de tela. */
type Alvo = { x: number; y: number; escala: number };

/**
 * Mede a marca real do cabeçalho para a intro pousar exatamente nela.
 *
 * Se não achar (layout mudou, componente renomeado), devolve `null` e a intro
 * cai num final honesto — sobe e some, sem voo. Um alvo errado seria pior que
 * alvo nenhum: a marca terminaria deslocada e pareceria defeito.
 */
function medirAlvo(elemento: HTMLElement | null): Alvo | null {
  // O primeiro <span> dentro do Logo é o quadrado da marca (MimuIcon).
  const destino = document.querySelector<HTMLElement>(
    'header a[aria-label="Mimu, início"] > span > span:first-child',
  );
  if (!destino || !elemento) return null;

  const d = destino.getBoundingClientRect();
  const o = elemento.getBoundingClientRect();
  if (d.width === 0 || o.width === 0) return null;

  return {
    x: d.left + d.width / 2 - (o.left + o.width / 2),
    y: d.top + d.height / 2 - (o.top + o.height / 2),
    escala: d.width / o.width,
  };
}

export function Preloader() {
  const [visivel, setVisivel] = useState(true);
  const [estagio, setEstagio] = useState<Estagio>("entrando");
  const [alvo, setAlvo] = useState<Alvo | null>(null);
  const marcaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisivel(false);
      return;
    }

    document.body.style.overflow = "hidden";
    // O Lenis controla o scroll por fora do documento (transform, não
    // scrollTop) — só travar `overflow` no body não impede o wheel/touch de
    // rolar a página por baixo da intro.
    window.__lenis?.stop();

    const liberar = () => {
      document.body.style.overflow = "";
      window.__lenis?.start();
    };

    const timers = [
      setTimeout(() => setEstagio("assinatura"), DURACAO.entrada),
      setTimeout(() => {
        // A medida é tirada AGORA, e não na montagem: o cabeçalho tem a
        // própria animação de entrada, e medir antes dela terminar daria a
        // posição de onde ele estava, não de onde ficou.
        setAlvo(medirAlvo(marcaRef.current));
        setEstagio("entregando");
      }, DURACAO.entrada + DURACAO.wordmark),
      setTimeout(() => {
        setVisivel(false);
        liberar();
      }, TOTAL),
    ];

    return () => {
      timers.forEach(clearTimeout);
      liberar();
    };
  }, []);

  if (!visivel) return null;

  const dentro = estagio !== "entrando";
  const assinado = estagio === "assinatura" || estagio === "entregando";
  const entregando = estagio === "entregando";

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      {/*
        A cortina é IRMÃ da marca, não mãe. Se fosse mãe, o `clip-path` dela
        recortaria a marca no meio do voo e o movimento sumiria pela metade.

        Ela desce e descobre a página de cima pra baixo, então o cabeçalho —
        que é justamente para onde a marca está indo — aparece primeiro. A
        chegada acontece sobre o destino já visível.
      */}
      <div
        className="absolute inset-0 bg-bg"
        style={{
          clipPath: entregando ? "inset(100% 0 0 0)" : "inset(0 0 0 0)",
          transition: `clip-path ${DURACAO.cortina}ms ${EASE_SAIDA}`,
        }}
      />

      <div
        ref={marcaRef}
        className="relative flex items-center gap-3.5"
        style={{
          // Sem alvo medido, a marca sobe junto com a cortina em vez de voar
          // pra um lugar errado.
          transform: entregando
            ? alvo
              ? `translate(${alvo.x}px, ${alvo.y}px) scale(${alvo.escala})`
              : "translateY(-24px)"
            : "translate(0, 0) scale(1)",
          // Some no finalzinho do voo: embaixo dela está a marca de verdade
          // do cabeçalho, e as duas visíveis ao mesmo tempo entregariam o
          // truque. O atraso deixa quase todo o percurso opaco.
          opacity: entregando ? 0 : dentro ? 1 : 0,
          transition: entregando
            ? `transform ${DURACAO.voo}ms ${EASE_SAIDA}, opacity 160ms ease-in ${DURACAO.voo - 120}ms`
            : `opacity ${DURACAO.entrada}ms ease-out`,
        }}
      >
        <div
          style={{
            transform: dentro ? "scale(1)" : "scale(0.84)",
            transition: `transform ${DURACAO.entrada}ms ${EASE_ENTRADA}`,
          }}
        >
          <MimuIcon className="size-14 rounded-[15px]" />
        </div>

        {/*
          O wordmark é descoberto por máscara, da esquerda pra direita, como
          se estivesse sendo escrito. A versão anterior deslizava 10px: um
          movimento pequeno demais para ser percebido como decisão, e que só
          deixava o texto "tremendo" ao aparecer.

          Some junto com a cortina porque o destino é a marca do cabeçalho, e
          lá o wordmark tem outro tamanho — levá-lo junto obrigaria a animar
          dois alvos e a chegada ficaria imprecisa.
        */}
        <span
          className="overflow-hidden font-brand text-[52px] leading-none text-white"
          style={{
            clipPath: assinado ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
            opacity: entregando ? 0 : 1,
            transition: entregando
              ? "opacity 220ms ease-in"
              : `clip-path ${DURACAO.wordmark}ms ${EASE_SAIDA}`,
          }}
        >
          mimu
        </span>
      </div>
    </div>
  );
}
