import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Os testes que NÃO falam com o banco.
 *
 * O `vitest.config.ts` principal sobe um Postgres local pelo Docker antes de
 * qualquer arquivo (ver testes/setup-global.ts) — é o que permite testar
 * isolamento entre contas de verdade, contra um banco real.
 *
 * O preço é que, com o Docker parado, a suíte INTEIRA não roda: nem os testes
 * de função pura, que não encostam no banco. Durante um dia de trabalho isso
 * significa não conseguir rodar teste nenhum por causa de uma dependência que
 * aqueles testes não têm.
 *
 * Esta config é a saída: mesmas regras, sem o preparo global.
 *
 *   npm run test:unidade
 *
 * NÃO SUBSTITUI a suíte completa, e não deve ser usada para "passou nos
 * testes" antes de subir — o que ela deixa de fora é justamente o que protege
 * dado de uma conta de aparecer na outra. Rode `npm test` com o Docker de pé
 * antes de publicar.
 */
export default defineConfig({
  test: {
    environment: "node",
    testTimeout: 30_000,
    // Os que precisam de banco ficam de fora por nome: eles falham com um erro
    // de Docker que não explica nada a quem só queria rodar o resto.
    exclude: [
      "**/node_modules/**",
      "testes/isolamento-por-conta.test.ts",
      "testes/acesso-no-canal.test.ts",
      "testes/canal-atendimento.test.ts",
      "testes/conectar-pelo-whatsapp.test.ts",
      "testes/mimu-no-whatsapp.test.ts",
      "testes/escrita-com-desfazer.test.ts",
      "testes/reversao.test.ts",
    ],
  },
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
});
