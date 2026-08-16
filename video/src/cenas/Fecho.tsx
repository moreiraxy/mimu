import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COR, FONTE, tracking, escala, type Formato } from "../marca";
import { MarcaDesenhando, Logotipo } from "../componentes/Marca";
import { entrada, mola } from "../movimento";
import { duracao } from "../roteiro";

/**
 * Fecho: a marca, a frase e onde encontrar.
 *
 * A frase é a mesma da home do site, palavra por palavra. Um vídeo que promete
 * uma coisa e um site que promete outra fazem a pessoa achar que chegou no
 * lugar errado, mesmo sem saber dizer por quê.
 *
 * Não há botão nem "clique no link": quem assiste no Instagram já sabe onde
 * ficam o perfil e a bio, e um botão falso num vídeo é só ruído.
 */
export function Fecho({ formato }: { formato: Formato }) {
  const frame = useCurrentFrame();
  const { t, margem } = escala(formato);
  const total = duracao("fecho");

  const brilho = mola(frame, 0, { damping: 30, stiffness: 60, mass: 1 });
  // O último meio segundo escurece até o preto, para o vídeo terminar e não
  // simplesmente parar. Em repetição automática, o corte seco daria um pisca.
  const fechamento = interpolate(frame, [total - 12, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COR.fundo,
        justifyContent: "center",
        alignItems: "center",
        padding: margem,
        opacity: fechamento,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(46% 34% at 50% 46%, rgba(204,255,0,${0.14 * brilho}) 0%, transparent 72%)`,
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 36 * t,
        }}
      >
        <MarcaDesenhando tamanho={150 * t} atraso={0} />
        <Logotipo tamanho={124 * t} atraso={10} />
      </div>

      <div
        style={{
          ...entrada(frame, 26, { deslocamento: 26 }),
          position: "relative",
          marginTop: 54 * t,
          fontFamily: FONTE.display,
          fontSize: 60 * t,
          fontWeight: 500,
          lineHeight: 1.18,
          letterSpacing: tracking(60 * t),
          color: COR.tinta,
          textAlign: "center",
          textWrap: "balance",
          maxWidth: 1000 * t,
        }}
      >
        Enquanto você trabalha, a Mimu cuida do seu negócio.
      </div>

      <div
        style={{
          ...entrada(frame, 44, { deslocamento: 16 }),
          position: "relative",
          marginTop: 64 * t,
          fontFamily: FONTE.mono,
          fontSize: 30 * t,
          letterSpacing: "0.16em",
          color: COR.neon,
        }}
      >
        @mimu.ia
      </div>
    </AbsoluteFill>
  );
}
