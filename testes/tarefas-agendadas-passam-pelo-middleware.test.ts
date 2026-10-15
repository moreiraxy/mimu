import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/*
 * Toda rota de tarefa agendada precisa estar liberada no middleware.
 *
 * ISTO JÁ QUEBROU. `/api/cron/posto` nasceu para gerar os avisos nos horários
 * da rotina dela e NÃO foi acrescentada em ROTAS_PUBLICAS_SEM_AUTH. O
 * agendador do banco faz POST sem sessão; o middleware devolvia a página de
 * /login com 307; o `net.http_post` recebia uma resposta de sucesso e a tarefa
 * "rodava" todos os dias sem criar um único aviso.
 *
 * O defeito é mudo dos dois lados: no banco a tarefa aparece como executada, e
 * no app a pessoa só percebe que nunca é avisada de nada. Foi exatamente o
 * sintoma que a tarefa existia para corrigir.
 *
 * Por isso o teste lê o DISCO: qualquer pasta nova em app/api/cron/ entra na
 * conta sem ninguém precisar lembrar.
 */

const RAIZ = process.cwd();
const DIR_CRON = join(RAIZ, "app", "api", "cron");

const MIDDLEWARE = readFileSync(
  join(RAIZ, "lib", "supabase", "middleware.ts"),
  "utf8",
);

function rotasDeCron(): string[] {
  return readdirSync(DIR_CRON)
    .filter((nome) => statSync(join(DIR_CRON, nome)).isDirectory())
    .map((nome) => `/api/cron/${nome}`);
}

describe("tarefas agendadas atravessam o middleware", () => {
  const rotas = rotasDeCron();

  it("existe tarefa agendada para conferir", () => {
    expect(rotas.length).toBeGreaterThan(0);
  });

  it.each(rotas)("%s está liberada de login", (rota) => {
    expect(
      MIDDLEWARE,
      `${rota} não está em ROTAS_PUBLICAS_SEM_AUTH. O agendador do banco não ` +
        `tem sessão: o middleware vai devolver a página de login, o POST vai ` +
        `parecer bem-sucedido e a tarefa nunca vai fazer nada.`,
    ).toContain(`"${rota}"`);
  });

  it("cada uma continua exigindo o segredo no cabeçalho", () => {
    // Liberar do login não pode virar rota aberta: a proteção passa a ser
    // inteiramente do próprio arquivo.
    for (const rota of rotas) {
      const arquivo = readFileSync(
        join(DIR_CRON, rota.split("/").pop()!, "route.ts"),
        "utf8",
      );
      expect(arquivo, rota).toContain("autorizado(request)");
    }
  });
});
