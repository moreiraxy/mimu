import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

// Este app vive dentro do repo do mimu, que tem o próprio package-lock.json na
// raiz. O Turbopack infere a raiz do projeto procurando o lockfile mais próximo
// subindo os diretórios, então sem isso ele elege o mimu como raiz e passa a
// puxar o postcss.config.mjs e o middleware.ts de lá — que quebram o build.
// Fixar a raiz aqui mantém a v2 autocontida.
const nextConfig: NextConfig = {
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
};

export default nextConfig;
