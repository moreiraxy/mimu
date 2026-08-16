import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COR, escala, type Formato } from "../marca";
import { MarcaDesenhando, Logotipo } from "../componentes/Marca";
import { Frase } from "../componentes/Frase";
import { saida, mola } from "../movimento";
import { duracao } from "../roteiro";

/**
 * A virada: os três lugares soltos viram um só.
 *
 * É a cena mais curta e a mais silenciosa de propósito. Depois da bagunça,
 * uma tela quase vazia com o traço se desenhando é o próprio argumento: cabe
 * tudo em uma coisa só. Encher esta cena de texto desfaria o alívio.
 */
export function Marca({ formato }: { formato: Formato }) {
  const frame = useCurrentFrame();
  const { t, margem } = escala(formato);
  const restam = duracao("marca") - frame;
  const opacidade = saida(restam, 14);

  const brilho = mola(frame, 6);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COR.fundo,
        justifyContent: "center",
        alignItems: "center",
        padding: margem,
        opacity: opacidade,
      }}
    >
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(38% 30% at 50% 44%, rgba(204,255,0,${0.16 * brilho}) 0%, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 40 * t,
          marginBottom: 56 * t,
        }}
      >
        <MarcaDesenhando tamanho={170 * t} atraso={4} />
        <Logotipo tamanho={140 * t} atraso={26} />
      </div>

      <Frase
        texto="Tudo num lugar só."
        tamanho={62 * t}
        atraso={40}
        peso={500}
        cor={COR.apagado}
        larguraMaxima={900 * t}
      />
    </AbsoluteFill>
  );
}
