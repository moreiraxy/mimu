import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";

/*
 * Os dois repositórios têm que apontar para o mesmo commit.
 *
 * A Mimu vive em dois lugares no GitHub: `moreiraxy/mimu`, que é o de trabalho,
 * e `zanettizmax-boop/mimu`, que é de onde a Hostinger lê para publicar. Não é
 * um desenho bom — é o que a Hostinger impôs ao clonar o projeto para uma conta
 * própria — e a dívida está anotada.
 *
 * Enquanto os dois existirem, o risco é este: um fica para trás e ninguém nota.
 * O deploy sobe versão velha, sem erro em lugar nenhum, e a caçada começa pelo
 * lugar errado — pelo código, que está certo.
 *
 * `git push` já manda para os dois de uma vez (dois push URLs no mesmo remote),
 * então o caminho normal não desalinha. O que desalinha é edição feita direto
 * no site do GitHub, ou push a partir de outra máquina onde essa configuração
 * não existe. É disso que este teste protege.
 */

/*
 * 8 segundos por consulta, e não 20.
 *
 * São DUAS consultas de rede, e o vitest desiste do teste em 30. Com 20 cada,
 * uma conexão ruim estourava o limite do vitest ANTES de o git desistir — e o
 * teste morria com "Test timed out", sem chegar ao caminho que trata falta de
 * rede com um aviso. O resultado era vermelho por causa da internet, três
 * vezes num dia só, e teste que grita por motivo errado deixa de ser lido.
 *
 * `GIT_TERMINAL_PROMPT=0` é o par disso: sem ele, um remote que peça
 * credencial fica esperando alguém digitar, e nenhum timeout de processo
 * resolve uma espera por teclado.
 */
function git(...args: string[]): string {
  return execFileSync("git", args, {
    encoding: "utf8",
    timeout: 8_000,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  }).trim();
}

/** O commit que um repositório remoto tem em `main`, ou null se não deu para saber. */
function commitRemoto(remote: string): string | null {
  try {
    const saida = git("ls-remote", remote, "refs/heads/main");
    return saida.split(/\s/)[0] || null;
  } catch {
    // Sem rede, sem credencial, ou remote inexistente. Ver o comentário do
    // teste abaixo sobre por que isso não falha.
    return null;
  }
}

describe("os dois repositórios", () => {
  it("apontam para o mesmo commit", () => {
    const trabalho = commitRemoto("origin");
    const deploy = commitRemoto("hostinger");

    /*
     * Sem rede ou sem o remote configurado, o teste não tem o que afirmar.
     *
     * Falhar aqui puniria quem está sem internet ou clonou o projeto noutra
     * máquina, por um problema que não é dele. E é justamente onde o teste não
     * roda que ele também não protege — por isso a mensagem diz o que ficou
     * sem ser verificado, em vez de passar calado.
     */
    if (trabalho === null || deploy === null) {
      console.warn(
        "[sincronia] não deu para consultar os dois repositórios " +
          "(sem rede, sem credencial, ou o remote 'hostinger' não existe aqui). " +
          "A conferência NÃO foi feita.",
      );
      return;
    }

    expect(
      deploy,
      "Os dois repositórios estão em commits diferentes. A Hostinger publica a " +
        "partir de 'hostinger' — se ele estiver atrás, o deploy sobe versão velha " +
        "sem erro nenhum aparecer.\n" +
        `  moreiraxy (trabalho): ${trabalho.slice(0, 8)}\n` +
        `  hostinger (deploy):   ${deploy.slice(0, 8)}\n` +
        "Conserto: git push origin main (vai para os dois de uma vez).",
    ).toBe(trabalho);
  });
});
