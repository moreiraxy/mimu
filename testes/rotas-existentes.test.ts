import { describe, expect, it } from "vitest";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { AREAS_DO_APP, enderecoExiste } from "@/lib/rotas-existentes";

/*
 * A lista de áreas do app não pode envelhecer em silêncio.
 *
 * Ela existe para o endereço inventado cair na nossa tela de 404 em vez de ser
 * desviado para o login. O risco é o inverso: rota NOVA que ninguém acrescenta
 * aqui vira 404 para quem não está logada — uma página real que some, sem erro
 * em lugar nenhum, descoberta por reclamação.
 *
 * Por isso o teste lê os arquivos de verdade em vez de repetir a lista.
 */

const RAIZ = join(process.cwd(), "app");

/** Grupo de rota — `(dashboard)`, `(marketing)` — não aparece no endereço. */
function ehGrupoDeRota(nome: string): boolean {
  return nome.startsWith("(") && nome.endsWith(")");
}

/**
 * Os primeiros pedaços de endereço que o app serve de verdade.
 *
 * Atravessa os grupos de rota porque eles somem da URL: uma página em
 * `app/(dashboard)/agenda/page.tsx` responde por `/agenda`.
 */
function areasNoDisco(dir: string = RAIZ): Set<string> {
  const achadas = new Set<string>();

  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (!statSync(caminho).isDirectory()) continue;

    // `_pasta` e `api` não entram: a primeira é convenção de "não é rota", e a
    // segunda é tratada à parte em `enderecoExiste`.
    if (nome.startsWith("_") || nome === "api") continue;

    if (ehGrupoDeRota(nome)) {
      for (const area of areasNoDisco(caminho)) achadas.add(area);
      continue;
    }

    // Segmento dinâmico (`[id]`) nunca é primeiro pedaço de endereço.
    if (nome.startsWith("[")) continue;

    // Só conta como área quem tem página ou rota em algum lugar abaixo.
    if (temRotaAbaixo(caminho)) achadas.add(nome);
  }

  return achadas;
}

function temRotaAbaixo(dir: string): boolean {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      if (temRotaAbaixo(caminho)) return true;
      continue;
    }
    if (nome === "page.tsx" || nome === "route.ts") return true;
  }
  return false;
}

/**
 * As rotas da landing, que são arquivos estáticos em public/lp/.
 *
 * Devolve vazio quando a pasta não existe — ela nasce em `npm run build:lp`, e
 * quebrar o teste por causa de um build que ninguém rodou seria ruído. A
 * checagem que importa (área nova em app/ sem entrada na lista) não depende
 * desta.
 */
function areasDaLanding(): string[] {
  const lp = join(process.cwd(), "public", "lp");
  try {
    return readdirSync(lp)
      .filter((nome) => statSync(join(lp, nome)).isDirectory())
      .concat(
        readdirSync(lp)
          .filter((nome) => nome.endsWith(".html"))
          .map((nome) => nome.replace(/\.html$/, "")),
      );
  } catch {
    return [];
  }
}

describe("as áreas do app", () => {
  it("cobrem tudo que existe no disco", () => {
    const noDisco = [...areasNoDisco()].sort();
    const naLista = new Set<string>(AREAS_DO_APP);

    const faltando = noDisco.filter((area) => !naLista.has(area));

    expect(
      faltando,
      `Estas áreas existem em app/ mas não estão em lib/rotas-existentes.ts. ` +
        `Sem elas, quem não está logada recebe 404 numa página que existe: ${faltando.join(", ")}`,
    ).toEqual([]);
  });

  it("não inventam área que não existe", () => {
    const noDisco = areasNoDisco();

    // Endereços servidos por arquivo solto, não por pasta — não aparecem na
    // varredura de diretórios, mas são rotas de verdade.
    const porArquivo = new Set([
      "auth",
      "llms.txt",
      "manifest.webmanifest",
      "robots.txt",
      "sitemap.xml",
    ]);

    // A landing não mora em app/. Ela é construída à parte e copiada para
    // public/lp/, e /historias e /legal chegam lá por reescrita. Sem olhar
    // aqui, o teste diria que essas duas áreas não existem — e o conserto
    // seria tirá-las da lista, o que devolveria o desvio para o login
    // justamente nas páginas que uma visitante lê ANTES de ter conta.
    for (const rota of areasDaLanding()) noDisco.add(rota);

    const sobrando = [...AREAS_DO_APP].filter(
      (area) => !noDisco.has(area) && !porArquivo.has(area),
    );

    expect(
      sobrando,
      `Estas áreas estão na lista mas não existem mais em app/: ${sobrando.join(", ")}`,
    ).toEqual([]);
  });
});

describe("enderecoExiste", () => {
  it("reconhece a raiz e as áreas de verdade", () => {
    expect(enderecoExiste("/")).toBe(true);
    expect(enderecoExiste("/dashboard")).toBe(true);
    expect(enderecoExiste("/agenda/hoje")).toBe(true);
    expect(enderecoExiste("/legal/privacidade")).toBe(true);
  });

  it("recusa endereço inventado — que é o ponto todo", () => {
    expect(enderecoExiste("/qualqercoisa")).toBe(false);
    expect(enderecoExiste("/wp-admin")).toBe(false);
    expect(enderecoExiste("/.env")).toBe(false);
  });

  it("deixa a API responder por si", () => {
    // Rota de API inexistente deve devolver o 404 do Next, sem HTML: quem
    // chama ali é código, e uma página com botões só atrapalha a depuração.
    expect(enderecoExiste("/api/nao-existe")).toBe(true);
  });
});
