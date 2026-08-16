import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COR, FONTE, escala, type Formato } from "../marca";
import { Frase } from "../componentes/Frase";
import { entrada, saida } from "../movimento";
import { duracao } from "../roteiro";

/**
 * Abertura: a pergunta que o vídeo inteiro responde.
 *
 * Começa com a afirmação que a pessoa reconhece ("você abre todo dia") e só
 * depois vira pergunta. Abrir direto na pergunta soaria como cobrança; do
 * jeito que está, a primeira linha é sobre ela e a segunda é o incômodo que
 * ela já tem.
 */
export function Pergunta({ formato }: { formato: Formato }) {
  const frame = useCurrentFrame();
  const { t, margem } = escala(formato);
  const restam = duracao("pergunta") - frame;
  const opacidade = saida(restam, 14);

  const marcador = entrada(frame, 0, { deslocamento: 14 });

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
        style={{
          ...marcador,
          fontFamily: FONTE.mono,
          fontSize: 26 * t,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: COR.apagado,
          marginBottom: 64 * t,
        }}
      >
        Para quem toca o negócio sozinha
      </div>

      <Frase
        texto="Você abre o seu negócio todo dia."
        tamanho={92 * t}
        atraso={8}
        larguraMaxima={1000 * t}
      />

      <div style={{ height: 52 * t }} />

      <Frase
        texto="Mas quem cuida das contas dele?"
        tamanho={92 * t}
        atraso={56}
        destaque={["contas"]}
        larguraMaxima={1000 * t}
      />
    </AbsoluteFill>
  );
}
