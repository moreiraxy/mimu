import type { ReactNode } from "react";

/**
 * Envelope pro parallax de scroll que a Hero já usava. Quem lê esses
 * atributos é o `useParallaxFloat` (src/hooks/useParallaxFloat.ts), chamado
 * uma vez no App: ele varre o documento inteiro atrás de `[data-parallax]`,
 * então qualquer seção pode usar sem montar nada a mais.
 *
 * `forca` é a escala 0–100 do hook. O deslocamento máximo é
 * `forca * 0.22` px pra cada lado (TRANSLATE_K = 0.22 no hook), ou seja:
 * 20 → ±4,4px   30 → ±6,6px   45 → ±10px.
 *
 * `padrao` decide o sentido: 1 acompanha o scroll, 2 vai ao contrário. Hoje
 * o site inteiro usa 1 (mesma direção em tudo, a pedido) — a profundidade
 * vem da diferença de `forca` entre os elementos, não do sentido. Sem
 * definir, o hook SORTEIA um a cada carregamento, e aí a página muda de
 * comportamento sem motivo; por isso aqui é sempre explícito.
 *
 * IMPORTANTE: o hook escreve `transform` inline neste nó a cada frame. Então
 * ele nunca pode ser o mesmo elemento que já anima transform por conta
 * própria (entrada com translateY, hover:-translate-y, marquee, tilt) — o
 * inline ganha e mata a outra animação. Por isso ele entra sempre como um nó
 * separado, por fora de quem já anima.
 */
export function Parallax({
  forca = 30,
  padrao = 1,
  className = "",
  children,
}: {
  forca?: number;
  padrao?: 1 | 2;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={className}
      data-parallax=""
      data-parallax-strength={forca}
      data-parallax-pattern={padrao}
    >
      {children}
    </div>
  );
}
