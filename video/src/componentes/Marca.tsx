import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { COR, FONTE, tracking } from "../marca";
import { mola, MOLA } from "../movimento";

/**
 * O "M" da Mimu se desenhando.
 *
 * O traço é o mesmo do ícone do app (app/icon.svg), com o mesmo comando de
 * path. Ele é desenhado, e não revelado por máscara, porque o desenho conta
 * de onde a forma vem: começa num ponto e percorre o caminho, como alguém
 * escrevendo. Uma máscara só empurraria uma cortina por cima.
 *
 * O comprimento do traço é medido no próprio elemento em vez de chutado: um
 * número errado deixa o traço aparecendo pela metade ou já pronto no primeiro
 * quadro, e isso não dá para ver revisando o código, só o vídeo pronto.
 */
const CAMINHO_M =
  "M106 249.5 L106 143.5 Q106 106 143.75 106 Q181.5 106 193.75 143.5 L256 249.5 L318.25 143.5 Q330.5 106 368.25 106 Q406 106 406 143.5 L406 249.5";

export function MarcaDesenhando({
  tamanho,
  atraso = 0,
  comCaixa = true,
}: {
  tamanho: number;
  atraso?: number;
  comCaixa?: boolean;
}) {
  const frame = useCurrentFrame();
  const caminho = React.useRef<SVGPathElement>(null);
  const [comprimento, setComprimento] = React.useState(0);

  React.useEffect(() => {
    if (caminho.current) setComprimento(caminho.current.getTotalLength());
  }, []);

  const t = frame - atraso;
  const desenho = interpolate(t, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.22, 1, 0.36, 1),
  });
  const caixa = mola(frame, atraso - 4, MOLA.comPeso);

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 512 512"
      style={{ overflow: "visible" }}
    >
      {comCaixa && (
        <rect
          width={512}
          height={512}
          rx={112}
          fill={COR.neon}
          style={{
            transformOrigin: "256px 256px",
            transform: `scale(${0.7 + 0.3 * caixa})`,
            opacity: caixa,
          }}
        />
      )}
      <path
        ref={caminho}
        d={CAMINHO_M}
        stroke={comCaixa ? COR.fundo : COR.neon}
        strokeWidth={31.25}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray={comprimento || 1}
        strokeDashoffset={(comprimento || 1) * (1 - desenho)}
      />
    </svg>
  );
}

/** A marca escrita, no peso e no tracking do brand book. */
export function Logotipo({
  tamanho,
  atraso = 0,
}: {
  tamanho: number;
  atraso?: number;
}) {
  const frame = useCurrentFrame();
  const p = mola(frame, atraso, MOLA.firme);

  return (
    <span
      style={{
        fontFamily: FONTE.display,
        fontSize: tamanho,
        fontWeight: 700,
        letterSpacing: tracking(tamanho),
        color: COR.tinta,
        lineHeight: 1,
        opacity: p,
        display: "inline-block",
        transform: `translateY(${(1 - p) * tamanho * 0.2}px)`,
      }}
    >
      mimu
    </span>
  );
}
