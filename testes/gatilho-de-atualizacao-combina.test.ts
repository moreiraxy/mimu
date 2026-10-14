import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * O gatilho de "atualizado em" tem que combinar com o nome da coluna.
 *
 * ISTO JÁ QUEBROU EM PRODUÇÃO. `posto_pendencias` nasceu com a coluna
 * `atualizada_em` e recebeu o gatilho genérico `set_updated_at()`, que faz
 * `new.updated_at = now()`. Resultado: TODO update na tabela morria com
 * `42703: record "new" has no field "updated_at"`.
 *
 * O pior é o jeito como isso aparece. `insert` continua funcionando (o gatilho
 * é `before update`), então criar pendência pela tela e pelo chat funcionava
 * — e concluir, que é o gesto que ninguém testa ao escrever a tela, falhava
 * sempre. Ela descobriu usando: "n to conseguindo concluir tarefas aq!!".
 *
 * O teste lê as migrations, acha cada gatilho de atualização e cobra que a
 * tabela tenha a coluna que aquela função escreve.
 */

const DIR = join(process.cwd(), "supabase", "migrations");

function sqlInteiro(): string {
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(DIR, f), "utf8"))
    .join("\n");
}

const SQL = sqlInteiro();

/** As colunas declaradas em qualquer `create table public.<nome>` do schema. */
function colunasDeclaradas(tabela: string): string {
  const bloco = new RegExp(
    `create table (?:if not exists )?public\\.${tabela}\\s*\\(([\\s\\S]*?)\\n\\);`,
    "g",
  );
  let texto = "";
  let achado: RegExpExecArray | null;
  while ((achado = bloco.exec(SQL)) !== null) texto += achado[1];
  // `alter table ... add column` também conta: coluna acrescentada depois é
  // coluna que existe.
  const alteracoes = new RegExp(
    `alter table public\\.${tabela}[\\s\\S]{0,200}?add column (\\w+)`,
    "g",
  );
  while ((achado = alteracoes.exec(SQL)) !== null) texto += `\n${achado[1]}`;
  return texto;
}

interface Gatilho {
  tabela: string;
  funcao: string;
}

function gatilhosDeAtualizacao(): Gatilho[] {
  const achados: Gatilho[] = [];
  const re =
    /create trigger \w+\s+before update on public\.(\w+)[\s\S]{0,200}?execute function public\.(set_updated_at|set_atualizada_em)\(\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(SQL)) !== null) {
    achados.push({ tabela: m[1]!, funcao: m[2]! });
  }
  return achados;
}

/** Qual coluna cada função escreve. */
const COLUNA_DA_FUNCAO: Record<string, string> = {
  set_updated_at: "updated_at",
  set_atualizada_em: "atualizada_em",
};

/**
 * O que vale é o ÚLTIMO gatilho criado para cada tabela.
 *
 * As migrations são história: `posto_pendencias` recebeu o gatilho errado em
 * 20261014190000 e o certo em 20261015020000, que derrubou o primeiro. Conferir
 * todas as linhas da história faria este teste acusar um defeito já corrigido —
 * e um teste que falha pelo passado é um teste que alguém desliga.
 */
function efetivos(): Gatilho[] {
  const porTabela = new Map<string, string>();
  for (const g of gatilhosDeAtualizacao()) porTabela.set(g.tabela, g.funcao);
  return Array.from(porTabela, ([tabela, funcao]) => ({ tabela, funcao }));
}

describe("gatilho de atualização combina com a coluna", () => {
  const gatilhos = efetivos();

  it("existe gatilho de atualização para conferir", () => {
    // Se a busca parar de achar nada, o teste passaria vazio para sempre.
    expect(gatilhos.length).toBeGreaterThan(3);
  });

  it.each(gatilhos)(
    "$tabela usa $funcao e tem a coluna correspondente",
    ({ tabela, funcao }) => {
      const coluna = COLUNA_DA_FUNCAO[funcao]!;
      expect(
        colunasDeclaradas(tabela),
        `A tabela ${tabela} recebe ${funcao}(), que escreve em "${coluna}" — ` +
          `mas não declara essa coluna. Todo UPDATE nela vai falhar com 42703, ` +
          `e o INSERT vai continuar funcionando, então o defeito só aparece na ` +
          `hora de editar.`,
      ).toContain(coluna);
    },
  );

  it("posto_pendencias ficou com a função certa", () => {
    expect(
      gatilhos.find((g) => g.tabela === "posto_pendencias")?.funcao,
    ).toBe("set_atualizada_em");
  });

  it("o gatilho quebrado foi derrubado, e não só substituído", () => {
    // `create trigger` com nome novo não remove o antigo: sem o `drop`, os
    // DOIS rodariam, e o errado continuaria derrubando todo update.
    expect(SQL).toContain(
      "drop trigger if exists set_posto_pendencias_updated_at on public.posto_pendencias",
    );
  });
});
