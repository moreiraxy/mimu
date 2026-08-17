import { useEffect, useRef, useState } from "react";
import { MimuIcon } from "./Logo";

/**
 * Intro de carregamento.
 *
 * A marca é medida contra a marca real do cabeçalho e voa até a posição exata
 * dela enquanto a cortina sobe. Quem assiste vê um movimento só, do centro da
 * tela até o canto onde o logo vive, e a página já está lá quando a cortina
 * passa.
 *
 * O "M" é DESENHADO, não revelado: o quadrado néon aparece e o traço se
 * escreve dentro dele, de uma ponta à outra. Uma máscara passando por cima
 * empurraria uma cortina; o traço percorrendo o caminho mostra a forma sendo
 * feita, que é o que a marca é — uma linha contínua, sem tirar a caneta do
 * papel.
 *
 * Não há mais o "mimu" escrito ao lado. Ele existia para a intro ter o que
 * revelar, e agora quem revela é o próprio traço. Tirá-lo também consertou a
 * pontaria do voo: a medida do destino divide a largura da marca do cabeçalho
 * pela largura do que está voando, e com o wordmark junto essas duas larguras
 * eram coisas diferentes, então a escala final saía pequena demais.
 *
 * 1,45s no total. Intro longa cobra o tempo de quem chegou, e cobra de novo a
 * cada visita.
 */

/** Saída padrão do site: começa rápido e desacelera, sem balanço. */
const EASE_SAIDA = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Entrada com um respiro de overshoot, só na chegada do quadrado. */
const EASE_ENTRADA = "cubic-bezier(0.34, 1.4, 0.64, 1)";
/**
 * Curva do traço, e ela NÃO pode ser a EASE_SAIDA do site.
 *
 * Aquela é violentamente adiantada: com ela, o "M" ficava 55% desenhado em 15%
 * do tempo e 96% na metade. O olho não lia isso como escrever, lia como a
 * letra aparecendo de uma vez e depois a pontinha da última perna se
 * arrastando sozinha pelo resto da animação. O movimento inteiro virava "uma
 * perninha animando".
 *
 * Esta distribui: 6%, 34%, 65%, 83% e 94% ao longo do tempo, sem nenhum salto
 * maior que 31% entre fatias. É o gesto de uma caneta, que sai do repouso,
 * anda num ritmo constante e desacelera no fim.
 */
const EASE_TRACO = "cubic-bezier(0.3, 0.05, 0.25, 1)";

const DURACAO = {
  /** O quadrado néon aparece, ainda vazio. */
  caixa: 360,
  /**
   * O traço começa ANTES de o quadrado terminar de crescer. Esperar o fim
   * deixaria dois movimentos em fila, um depois do outro; a sobreposição faz
   * os dois lerem como um gesto só.
   */
  atrasoTraco: 110,
  /** O "M" sendo escrito, de ponta a ponta. */
  traco: 620,
  /** Um respiro com o "M" inteiro na tela antes de ele sair voando. */
  respiro: 120,
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
const TOTAL =
  DURACAO.atrasoTraco + DURACAO.traco + DURACAO.respiro + DURACAO.cortina;

type Estagio = "entrando" | "escrevendo" | "entregando" | "fim";

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
      setTimeout(() => setEstagio("escrevendo"), DURACAO.atrasoTraco),
      setTimeout(() => {
        // A medida é tirada AGORA, e não na montagem: o cabeçalho tem a
        // própria animação de entrada, e medir antes dela terminar daria a
        // posição de onde ele estava, não de onde ficou.
        setAlvo(medirAlvo(marcaRef.current));
        setEstagio("entregando");
      }, DURACAO.atrasoTraco + DURACAO.traco + DURACAO.respiro),
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
  const escrito = estagio === "escrevendo" || estagio === "entregando";
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
        className="relative"
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
          // truque. O atraso deixa quase todo o percurso opaco. Quem faz a
          // entrada é a caixa lá dentro, não este contêiner.
          opacity: entregando ? 0 : 1,
          transition: entregando
            ? `transform ${DURACAO.voo}ms ${EASE_SAIDA}, opacity 160ms ease-in ${DURACAO.voo - 120}ms`
            : "none",
        }}
      >
        <div
          style={{
            transform: dentro ? "scale(1)" : "scale(0.72)",
            opacity: dentro ? 1 : 0,
            transition: `transform ${DURACAO.caixa}ms ${EASE_ENTRADA}, opacity ${DURACAO.caixa * 0.5}ms ease-out`,
          }}
        >
          {/* 96px, e não os 56 de antes: naquele tamanho a marca dividia a
              tela com o "mimu" escrito ao lado e o conjunto tinha presença.
              Sozinha, ela precisa ocupar o centro por conta própria, senão a
              abertura vira um ponto perdido no preto. O raio acompanha a
              proporção de sempre, 27% do lado. */}
          <MimuIcon
            className="size-24 rounded-[26px]"
            tracado={{
              visivel: escrito,
              duracaoMs: DURACAO.traco,
              easing: EASE_TRACO,
            }}
          />
        </div>
      </div>
    </div>
  );
}
