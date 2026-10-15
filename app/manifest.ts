import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mimu — posto de comando",
    short_name: "Mimu",
    description:
      "Rotina, pendências, compromissos, leads e dinheiro em um só lugar.",
    start_url: "/",
    display: "standalone",
    // Cor que o sistema pinta antes do app carregar. Acompanha o splash, que
    // agora é o fundo do brand book — antes ficava creme e piscava.
    background_color: "#0A0A0A",
    /*
     * A BARRA DO SISTEMA SAIU DO NÉON.
     *
     * `theme_color` é o que o Android pinta na barra de status do app
     * instalado. Era #CCFF00: uma faixa verde em cima de um app que agora é
     * preto e branco.
     *
     * O valor é o MESMO `background_color` acima, e isso é deliberado — é o
     * que o app/layout.tsx já faz na web (`themeColor` escuro = #0A0A0A). Com
     * os três iguais, a barra de status deixa de ser um elemento à parte e o
     * app parece começar no topo da tela, sem emenda.
     */
    theme_color: "#0A0A0A",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      // PNGs porque nem todo lugar aceita SVG: o Android usa estes na tela de
      // início, e sem o `maskable` ele corta o ícone num círculo e come as
      // pontas do desenho.
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
