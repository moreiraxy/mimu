import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/*
 * O pacote versionado tem que corresponder ao código-fonte.
 *
 * `dist-worker/whatsapp.js` é saída de build, e saída de build normalmente não
 * se versiona. Aqui ela vai para o repositório por imposição da hospedagem: o
 * campo de comando de build da Hostinger é uma lista fechada, sem o nosso
 * script — então o jeito de o worker existir lá é ele chegar pronto.
 *
 * O preço desse arranjo é conhecido: um dia alguém edita `worker/` e esquece de
 * reconstruir. O deploy sobe o pacote velho, sem erro nenhum, e a mudança
 * simplesmente não acontece — o pior tipo de falha, porque parece sucesso.
 *
 * Este teste é o que paga esse preço. Ele reconstrói e compara.
 */

describe("o worker empacotado", () => {
  it("corresponde ao código-fonte de hoje", () => {
    const temp = mkdtempSync(join(tmpdir(), "mimu-worker-"));
    const saida = join(temp, "whatsapp.js");

    try {
      execFileSync("node", ["scripts/construir-worker.mjs"], {
        env: { ...process.env, SAIDA_WORKER: saida },
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 120_000,
      });

      const recemConstruido = readFileSync(saida, "utf8");
      const versionado = readFileSync("dist-worker/whatsapp.js", "utf8");

      expect(
        versionado,
        "dist-worker/whatsapp.js está diferente do que o código-fonte produz " +
          "agora. Alguém mexeu em worker/ (ou em algo que ele importa) sem " +
          "reconstruir.\n" +
          "Conserto: npm run build:worker, e commite o resultado.\n" +
          "Sem isso o deploy sobe o worker antigo, sem erro nenhum aparecer.",
      ).toBe(recemConstruido);
    } finally {
      rmSync(temp, { recursive: true, force: true });
    }
  });
});
