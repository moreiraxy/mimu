import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { COR, FONTE, tracking, escala, type Formato } from "../marca";
import { Celular, TelaTrocavel, PROPORCAO_TELA } from "../componentes/Celular";
import { mola, MOLA, saida, entrada } from "../movimento";
import { duracao } from "../roteiro";

/**
 * O centro do vídeo: a pessoa pergunta, a Mimu responde.
 *
 * As quatro telas são capturas de verdade do app, tiradas com a conversa em
 * quatro momentos: só a pergunta, a pergunta com a resposta, e assim por
 * diante. Trocar entre elas é o que faz a conversa acontecer.
 *
 * Elas se sobrepõem com um cruzamento curto em vez de um corte seco porque
 * o corte, num app escuro com layout parecido, lê como falha de render. O
 * cruzamento diz "chegou mensagem nova" sem parecer defeito.
 */
const PASSOS = [
  { tela: "chat-1", entra: 26 },
  { tela: "chat-2", entra: 84 },
  { tela: "chat-3", entra: 162 },
  { tela: "chat-4", entra: 212 },
] as const;

const CRUZAMENTO = 12;

export function Ia({ formato }: { formato: Formato }) {
  const frame = useCurrentFrame();
  const { t, vertical, margem, alturaCelular } = escala(formato);
  const restam = duracao("ia") - frame;
  const opacidade = saida(restam, 16);

  const larguraTela = alturaCelular * PROPORCAO_TELA;
  const chegada = mola(frame, 0, MOLA.comPeso);

  /**
   * Avanço lento durante a cena inteira.
   *
   * São dez segundos com o mesmo enquadramento; sem isso o quadro congela e a
   * única coisa que muda é o texto trocando dentro da tela, o que faz parecer
   * uma foto com legenda. O movimento é pequeno de propósito: ele não pode
   * disputar com a conversa, só impedir que a imagem morra.
   */
  const avanco = interpolate(frame, [0, duracao("ia")], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  const legendas = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 26 * t,
        alignItems: vertical ? "center" : "flex-start",
        textAlign: vertical ? "center" : "left",
        maxWidth: vertical ? 900 * t : 620 * t,
      }}
    >
      <div
        style={{
          ...entrada(frame, 14, { deslocamento: 16 }),
          fontFamily: FONTE.mono,
          fontSize: 24 * t,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: COR.neon,
        }}
      >
        Você só pergunta
      </div>
      <div
        style={{
          ...entrada(frame, 22, { deslocamento: 22 }),
          fontFamily: FONTE.display,
          fontSize: 68 * t,
          fontWeight: 600,
          lineHeight: 1.08,
          letterSpacing: tracking(68 * t),
          color: COR.tinta,
        }}
      >
        Sem planilha,
        <br />
        sem relatório,
        <br />
        sem aprender nada.
      </div>
    </div>
  );

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
          display: "flex",
          flexDirection: vertical ? "column" : "row-reverse",
          alignItems: "center",
          justifyContent: "center",
          gap: vertical ? 60 * t : 120 * t,
        }}
      >
        <Celular
          alturaTela={alturaCelular}
          brilho={chegada}
          estilo={{
            opacity: chegada,
            transform: [
              `translateY(${(1 - chegada) * 90 - avanco * 16}px)`,
              `scale(${(0.9 + 0.1 * chegada) * (1 + avanco * 0.05)})`,
            ].join(" "),
          }}
        >
          {PASSOS.map((passo, i) => {
            const proximo = PASSOS[i + 1];
            const aparece = interpolate(
              frame,
              [passo.entra, passo.entra + CRUZAMENTO],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) },
            );
            // A tela anterior não some: a de cima cobre. Assim o quadro nunca
            // tem um instante de fundo vazio entre as duas.
            const some = proximo
              ? interpolate(
                  frame,
                  [proximo.entra, proximo.entra + CRUZAMENTO],
                  [1, 0],
                  { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
                )
              : 1;

            return (
              <TelaTrocavel
                key={passo.tela}
                tela={passo.tela}
                opacidade={aparece * some}
                larguraTela={larguraTela}
                alturaTela={alturaCelular}
              />
            );
          })}
        </Celular>

        {legendas}
      </div>
    </AbsoluteFill>
  );
}
