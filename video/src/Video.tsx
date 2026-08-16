import React from "react";
import { AbsoluteFill, Sequence } from "remotion";
import { COR, type Formato } from "./marca";
import { carregarFontes } from "./fontes";
import { inicios, duracao } from "./roteiro";
import { Pergunta } from "./cenas/Pergunta";
import { Bagunca } from "./cenas/Bagunca";
import { Marca } from "./cenas/Marca";
import { Ia } from "./cenas/Ia";
import { Fecho } from "./cenas/Fecho";

/**
 * A montagem. Uma composição só serve aos dois formatos: cada cena recebe o
 * formato e pede as próprias medidas em marca.ts.
 *
 * Escrever duas versões do vídeo garantiria que uma delas ficasse para trás
 * na primeira mudança de roteiro.
 */
export function Video({ formato }: { formato: Formato }) {
  carregarFontes();
  const de = inicios();

  return (
    <AbsoluteFill style={{ backgroundColor: COR.fundo }}>
      <Sequence from={de.pergunta} durationInFrames={duracao("pergunta")}>
        <Pergunta formato={formato} />
      </Sequence>
      <Sequence from={de.bagunca} durationInFrames={duracao("bagunca")}>
        <Bagunca formato={formato} />
      </Sequence>
      <Sequence from={de.marca} durationInFrames={duracao("marca")}>
        <Marca formato={formato} />
      </Sequence>
      <Sequence from={de.ia} durationInFrames={duracao("ia")}>
        <Ia formato={formato} />
      </Sequence>
      <Sequence from={de.fecho} durationInFrames={duracao("fecho")}>
        <Fecho formato={formato} />
      </Sequence>
    </AbsoluteFill>
  );
}
