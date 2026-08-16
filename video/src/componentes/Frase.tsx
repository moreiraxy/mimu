import React from "react";
import { useCurrentFrame } from "remotion";
import { COR, FONTE, tracking } from "../marca";
import { entrada } from "../movimento";

/**
 * Frase que aparece palavra por palavra.
 *
 * A palavra é a unidade porque é assim que se lê: entregar a frase inteira de
 * uma vez pede que a pessoa leia e escute ao mesmo tempo, e entregar letra
 * por letra vira efeito de terminal, que não tem nada a ver com a marca.
 *
 * Cada palavra é um `inline-block` para poder ser transformada sem quebrar a
 * linha; o espaço entre elas vem do `gap` do flex, não de um espaço em branco
 * dentro do texto, que sumiria junto com a palavra.
 */
export function Frase({
  texto,
  tamanho,
  atraso = 0,
  intervalo = 3.2,
  peso = 600,
  cor = COR.tinta,
  /** Palavras que ficam no néon. Comparação sem acento e sem pontuação. */
  destaque = [],
  alinhamento = "center",
  larguraMaxima,
  opacidade = 1,
}: {
  texto: string;
  tamanho: number;
  atraso?: number;
  intervalo?: number;
  peso?: number;
  cor?: string;
  destaque?: string[];
  alinhamento?: "center" | "left";
  larguraMaxima?: number;
  opacidade?: number;
}) {
  const frame = useCurrentFrame();
  const palavras = texto.split(" ");

  const normalizar = (p: string) =>
    p
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]/g, "");

  const destaques = new Set(destaque.map(normalizar));

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: alinhamento === "center" ? "center" : "flex-start",
        // O espaço entre palavras e entre linhas vem do gap. Linha grande
        // pede entrelinha curta, então o vertical é proporcionalmente menor.
        columnGap: tamanho * 0.26,
        rowGap: tamanho * 0.16,
        maxWidth: larguraMaxima,
        opacity: opacidade,
      }}
    >
      {palavras.map((palavra, i) => {
        const estilo = entrada(frame, atraso + i * intervalo, {
          deslocamento: tamanho * 0.32,
          escalaInicial: 0.9,
        });
        return (
          <span
            key={`${palavra}-${i}`}
            style={{
              ...estilo,
              display: "inline-block",
              fontFamily: FONTE.display,
              fontSize: tamanho,
              fontWeight: peso,
              lineHeight: 1,
              letterSpacing: tracking(tamanho),
              color: destaques.has(normalizar(palavra)) ? COR.neon : cor,
            }}
          >
            {palavra}
          </span>
        );
      })}
    </div>
  );
}
