import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { COR, FONTE, tracking, escala, type Formato } from "../marca";
import { mola, MOLA, saida } from "../movimento";
import { duracao } from "../roteiro";

/**
 * Onde a informação do negócio mora hoje: em três lugares que não conversam.
 *
 * Cada pedaço aparece como um objeto e não como texto porque o problema é
 * concreto. O caderno é escrito à mão, na Indie Flower, sobre papel; o
 * WhatsApp é um balão verde; a última é a que não tem lugar nenhum, e por
 * isso é a única sem objeto, só um ponto de interrogação no escuro.
 *
 * Eles entram tortos, com a mola de impulso, como coisa jogada na mesa. E
 * ficam desalinhados de propósito: alinhados, virariam um sistema organizado,
 * que é justamente o contrário do que a cena diz.
 */
interface Pedaco {
  rotulo: string;
  corpo: React.ReactNode;
  fundo: string;
  giro: number;
}

export function Bagunca({ formato }: { formato: Formato }) {
  const frame = useCurrentFrame();
  const { t, vertical, margem } = escala(formato);
  const restam = duracao("bagunca") - frame;
  const opacidade = saida(restam, 16);

  const pedacos: Pedaco[] = [
    {
      rotulo: "o caixa",
      fundo: COR.papel,
      giro: -3.5,
      corpo: (
        <span
          style={{
            fontFamily: FONTE.mao,
            fontSize: 54 * t,
            lineHeight: 1.35,
            color: "#2b2b2b",
          }}
        >
          220 + 90
          <br />
          120 + 70 + 45
          <br />
          menos 180 tinta
        </span>
      ),
    },
    {
      rotulo: "os horários",
      fundo: "#1F3B2E",
      giro: 2.8,
      corpo: (
        <span
          style={{
            fontFamily: FONTE.display,
            fontSize: 46 * t,
            fontWeight: 500,
            lineHeight: 1.4,
            color: "#DFF6E4",
          }}
        >
          &ldquo;consegue quarta
          <br />
          às 15h?&rdquo;
        </span>
      ),
    },
    {
      rotulo: "quanto sobrou",
      fundo: COR.superficie,
      giro: -1.6,
      corpo: (
        <span
          style={{
            fontFamily: FONTE.display,
            fontSize: 110 * t,
            fontWeight: 700,
            color: COR.apagado,
            letterSpacing: tracking(110 * t),
          }}
        >
          ?
        </span>
      ),
    },
  ];

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
          flexDirection: vertical ? "column" : "row",
          alignItems: "center",
          justifyContent: "center",
          gap: vertical ? 56 * t : 70 * t,
        }}
      >
        {pedacos.map((p, i) => {
          const atraso = 10 + i * 22;
          const m = mola(frame, atraso, MOLA.comPeso);
          // Perto do fim os três se afastam, abrindo espaço para a marca que
          // entra na cena seguinte reunindo tudo.
          const dispersao = interpolate(restam, [16, 46], [1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const direcao = i === 0 ? -1 : i === 2 ? 1 : 0;

          return (
            <div
              key={p.rotulo}
              style={{
                opacity: m,
                transform: [
                  `translateY(${(1 - m) * 90 + dispersao * (vertical ? direcao * 90 : 0)}px)`,
                  `translateX(${dispersao * (vertical ? 0 : direcao * 130)}px)`,
                  `rotate(${p.giro * m + dispersao * p.giro * 2}deg)`,
                  `scale(${0.88 + 0.12 * m})`,
                ].join(" "),
              }}
            >
              <div
                style={{
                  fontFamily: FONTE.mono,
                  fontSize: 24 * t,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: COR.apagado,
                  marginBottom: 20 * t,
                  textAlign: "center",
                }}
              >
                {p.rotulo}
              </div>
              <div
                style={{
                  width: vertical ? 700 * t : 440 * t,
                  minHeight: 250 * t,
                  padding: `${44 * t}px ${44 * t}px`,
                  borderRadius: 28 * t,
                  background: p.fundo,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  boxShadow: "0 30px 60px rgba(0,0,0,0.5)",
                  border:
                    p.fundo === COR.superficie
                      ? "1px solid rgba(255,255,255,0.08)"
                      : "none",
                }}
              >
                {p.corpo}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
}
