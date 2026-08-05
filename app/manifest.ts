import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mimu — seu negócio, organizado",
    short_name: "Mimu",
    description:
      "Assistente de gestão para microempreendedores de bairro: vendas, faturamento, agenda e clientes em um só lugar.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F6F3",
    theme_color: "#FF6B5B",
    icons: [
      {
        src: "/icon.svg",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
