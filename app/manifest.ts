import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mimu: seu negócio, organizado",
    short_name: "Mimu",
    description:
      "Assistente de gestão para microempreendedores de bairro: vendas, faturamento, agenda e clientes em um só lugar.",
    start_url: "/",
    display: "standalone",
    // Cor que o sistema pinta antes do app carregar. Acompanha o splash, que
    // agora é o fundo do brand book — antes ficava creme e piscava.
    background_color: "#0A0A0A",
    theme_color: "#CCFF00",
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
