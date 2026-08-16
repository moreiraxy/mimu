import React from "react";
import { Img, staticFile } from "remotion";
import { COR } from "../marca";

/**
 * O celular que segura as telas de verdade do app.
 *
 * As capturas são feitas em 390x844 (a área útil de um iPhone, sem barra de
 * navegador), então a moldura tem essa proporção e a imagem entra inteira,
 * sem corte nem esticão. `alturaTela` é quem manda: a largura sai dela.
 *
 * O brilho néon atrás não é enfeite. A tela do app é quase preta e o fundo do
 * vídeo também: sem alguma coisa separando os dois, o celular desaparece no
 * fundo e a borda vira o único contorno.
 */
const PROPORCAO = 390 / 844;

export function Celular({
  tela,
  alturaTela,
  /** Fração da altura da tela mostrada a partir do topo. 1 mostra tudo. */
  recorte = 1,
  estilo,
  brilho = 1,
  /** Quando presente, substitui a imagem única (usado para trocar de tela). */
  children,
}: {
  tela?: string;
  alturaTela: number;
  recorte?: number;
  estilo?: React.CSSProperties;
  brilho?: number;
  children?: React.ReactNode;
}) {
  const larguraTela = alturaTela * PROPORCAO;
  const borda = alturaTela * 0.014;
  const raio = alturaTela * 0.062;

  return (
    <div style={{ position: "relative", ...estilo }}>
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: -alturaTela * 0.16,
          background: `radial-gradient(50% 42% at 50% 48%, rgba(204,255,0,${0.3 * brilho}) 0%, transparent 72%)`,
          filter: `blur(${alturaTela * 0.03}px)`,
        }}
      />
      <div
        style={{
          position: "relative",
          width: larguraTela + borda * 2,
          height: alturaTela * recorte + borda * 2,
          borderRadius: raio,
          background: COR.superficie,
          padding: borda,
          boxShadow: `0 ${alturaTela * 0.04}px ${alturaTela * 0.09}px rgba(0,0,0,0.55), inset 0 0 0 1px rgba(255,255,255,0.09)`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "relative",
            width: larguraTela,
            height: alturaTela,
            borderRadius: raio - borda,
            overflow: "hidden",
          }}
        >
          {children ?? (
            <Img
              src={staticFile(`telas/${tela}.png`)}
              style={{
                width: larguraTela,
                height: alturaTela,
                display: "block",
                // O recorte corta por baixo. `objectPosition` no topo garante
                // que o que fica é o começo da tela, não o meio dela.
                objectFit: "cover",
                objectPosition: "top",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Uma tela dentro do celular, que aparece num quadro e some quando a próxima
 * chega. Usado para a conversa acontecer de verdade: cada captura é o app num
 * momento da conversa, não um balão desenhado por cima.
 */
export function TelaTrocavel({
  tela,
  opacidade,
  larguraTela,
  alturaTela,
}: {
  tela: string;
  opacidade: number;
  larguraTela: number;
  alturaTela: number;
}) {
  return (
    <Img
      src={staticFile(`telas/${tela}.png`)}
      style={{
        position: "absolute",
        inset: 0,
        width: larguraTela,
        height: alturaTela,
        display: "block",
        objectFit: "cover",
        objectPosition: "top",
        opacity: opacidade,
      }}
    />
  );
}

export const PROPORCAO_TELA = PROPORCAO;
