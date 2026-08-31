import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * O Baileys precisa continuar na linha 6.7.x.
 *
 * A NUMERAÇÃO DELE É UMA ARMADILHA. Existem duas linhas vivas no npm com
 * prefixo 6:
 *
 *   6.17.16  publicada em março/2025, ABANDONADA e depreciada, com
 *            vulnerabilidade crítica de spoofing de mensagem
 *            (GHSA-qvv5-jq5g-4cgg)
 *   6.7.24   publicada em julho/2026, é a linha mantida — a tag `legacy` do
 *            projeto aponta para ela
 *
 * Semver lê 17 > 7, então `^6` e até `^6.7.24` resolvem para a ABANDONADA. Foi
 * exatamente assim que ela entrou aqui: ninguém escolheu, o npm escolheu.
 *
 * Numa ferramenta que registra venda por mensagem, forjar mensagem é forjar
 * faturamento. E o aviso de depreciação passa no meio de dezenas de outros
 * durante a instalação — foi o que aconteceu, e só apareceu semanas depois,
 * por acaso, enquanto eu investigava outra coisa.
 *
 * A 6.7.24 traz também `senderPn`, o telefone ao lado do identificador novo do
 * WhatsApp. Sem ele não dá para saber de quem é a conversa. Voltar para a linha
 * antiga quebraria o vínculo de conta, além de reabrir a falha.
 */

const raiz = process.cwd();

function versao(caminho: string, chave: "dependencies" | "instalada"): string {
  const json = JSON.parse(readFileSync(join(raiz, caminho), "utf8"));
  return chave === "instalada" ? json.version : json.dependencies.baileys;
}

describe("a versão do Baileys", () => {
  it("está declarada presa à linha 6.7.x", () => {
    const declarada = versao("package.json", "dependencies");

    /*
     * `~` e não `^`. A diferença é tudo aqui: `^6.7.24` aceita 6.17.16, porque
     * para o semver ela é mais nova. `~6.7.24` para em 6.7.x, que é a linha
     * mantida — continua recebendo correção, sem pular para a abandonada.
     */
    expect(
      declarada,
      "O intervalo do baileys precisa ser ~6.7.x. Com ^ (circunflexo), o npm " +
        "resolve para 6.17.16 — abandonada desde março/2025, depreciada, e com " +
        "vulnerabilidade crítica de spoofing de mensagem. Ela PARECE mais nova " +
        "porque 17 > 7, e foi assim que entrou aqui da primeira vez.",
    ).toMatch(/^~6\.7\./);
  });

  it("é a que está instalada de fato", () => {
    const instalada = versao("node_modules/baileys/package.json", "instalada");

    expect(
      instalada,
      `Instalada: ${instalada}. Precisa ser 6.7.x — a 6.17.x é a linha ` +
        "abandonada e vulnerável, e não tem `senderPn`, sem o qual não dá para " +
        "saber de quem é a conversa quando o WhatsApp usa o identificador novo.",
    ).toMatch(/^6\.7\./);
  });

  it("entrega o telefone junto do identificador novo", async () => {
    /*
     * `senderPn` é o que a 6.7.x tem e a abandonada não. Verificar a presença
     * do campo, e não só o número da versão, é o que garante que a correção
     * continua valendo se um dia a numeração mudar de novo.
     */
    const tipos = readFileSync(
      join(raiz, "node_modules/baileys/lib/Types/Message.d.ts"),
      "utf8",
    );

    expect(
      tipos,
      "A versão instalada do baileys não declara `senderPn`. Sem ele, mensagem " +
        "endereçada por `@lid` chega sem telefone, e o vínculo de conta passa a " +
        "guardar um identificador interno no lugar do número.",
    ).toContain("senderPn");
  });
});
