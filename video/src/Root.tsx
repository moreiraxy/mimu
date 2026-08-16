import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { FPS, DURACAO_TOTAL } from "./roteiro";

/**
 * Os dois formatos pedidos: 9:16 para Reels e Stories, 16:9 para o site.
 * 1080x1920 e 1920x1080 são as resoluções que o Instagram e o YouTube
 * entregam sem reamostrar.
 */
export function RemotionRoot() {
  return (
    <>
      <Composition
        id="Vertical"
        component={Video}
        durationInFrames={DURACAO_TOTAL}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{ formato: "vertical" as const }}
      />
      <Composition
        id="Horizontal"
        component={Video}
        durationInFrames={DURACAO_TOTAL}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{ formato: "horizontal" as const }}
      />
    </>
  );
}
