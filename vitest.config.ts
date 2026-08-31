import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Os testes da Mimu.
 *
 * `alias` repete o `paths` do tsconfig porque o Vitest não lê tsconfig: sem
 * isto, todo import de "@/lib/..." falha e nenhum teste roda.
 *
 * Sem ambiente de navegador de propósito. O que existe para testar hoje é
 * isolamento entre contas, que é servidor e banco — jsdom só somaria tempo de
 * subida a cada rodada.
 */
export default defineConfig({
  test: {
    environment: "node",
    // Ver testes/setup-global.ts: prepara o banco uma vez, e não por arquivo.
    globalSetup: ["./testes/setup-global.ts"],
    // O teste de vazamento fala com o Postgres local a cada asserção. O padrão
    // de 5s estoura na primeira rodada, quando o banco ainda está acordando.
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
});
