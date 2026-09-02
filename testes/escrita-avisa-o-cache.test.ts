import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/*
 * Toda escrita feita pelo navegador tem que avisar o cache das telas.
 *
 * As telas abrem com o que já mostraram uma vez (lib/cache-de-tela.ts) e
 * atualizam por baixo. Quem grava e não avisa deixa a pessoa olhando o número
 * de antes — e num app de dinheiro isso não é "um instante desatualizado": é o
 * registro que funcionou e a tela dizendo que não.
 *
 * JÁ ACONTECEU: quando o cache nasceu, o caminho de registro pelo chat da Mimu
 * ficou de fora, e faturar pela conversa não mexia no faturamento da tela. O
 * comentário do próprio `limpaCache` avisa que uma lista de exceções é uma
 * lista que alguém esquece de atualizar — este teste é quem lembra.
 *
 * Vale só para o CLIENTE. Escrita de servidor (rotas de API, server actions)
 * não tem cache de tela para invalidar: quem lê aquilo já busca de novo.
 */

const RAIZ = process.cwd();

/** Quem já garante o aviso por outro caminho. */
const AVISA_POR_TABELA = ["limpaCache", "useVoltarAposCriar"];

/*
 * Escritas que não mexem em nada que uma tela guarde.
 *
 * Cada linha aqui é uma DECISÃO, e por isso cada uma tem o seu motivo escrito.
 * Acrescentar um arquivo sem pensar é o mesmo que não ter o teste.
 */
const FORA = new Set([
  // Fila offline: ela REAPLICA escritas que já passaram por aqui uma vez.
  "lib/offline/sync.ts",
  // Antes de a pessoa entrar no app não há tela guardada.
  "app/(marketing)/assinar/page.tsx",
  // Marca o aviso de push como respondido; nenhuma tela lê isso.
  "components/PushPermissionPrompt.tsx",
  /*
   * Os três abaixo gravam campos da PRÓPRIA EMPRESA — nome, telefone, tema,
   * preferências de alerta. Esses campos moram no AuthProvider, que é
   * atualizado na hora por `atualizarEmpresa`, e nenhuma das listas guardadas
   * (painel, transações, agenda, clientes, produtos) deriva deles.
   */
  "app/(dashboard)/minha-empresa/DadosNegocioSection.tsx",
  "app/(dashboard)/minha-empresa/PreferenciasSection.tsx",
  "components/providers/ThemeProvider.tsx",
  // Marca alerta como lido. Os alertas vivem no estado do próprio provider.
  "components/providers/AlertasProvider.tsx",
]);

function arquivosDe(dir: string, achados: string[] = []): string[] {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) {
      if (nome === "node_modules" || nome === "api") continue;
      arquivosDe(caminho, achados);
    } else if (nome.endsWith(".tsx") || nome.endsWith(".ts")) {
      achados.push(caminho);
    }
  }
  return achados;
}

describe("escrita no banco pelo navegador", () => {
  it("avisa o cache das telas", () => {
    const candidatos = [
      ...arquivosDe(join(RAIZ, "app")),
      ...arquivosDe(join(RAIZ, "hooks")),
      ...arquivosDe(join(RAIZ, "components")),
    ];

    const esquecidos: string[] = [];

    for (const caminho of candidatos) {
      const relativo = caminho.slice(RAIZ.length + 1);
      if (FORA.has(relativo)) continue;

      const fonte = readFileSync(caminho, "utf-8");

      // Só código de navegador: server actions e rotas não têm cache de tela.
      if (!fonte.includes('"use client"')) continue;
      // A escrita tem que ser de cliente, não do client de servidor.
      if (!fonte.includes("@/lib/supabase/client")) continue;

      const escreve = /\.(insert|upsert)\(|\.update\(\s*\{|\.delete\(\)/.test(
        fonte,
      );
      if (!escreve) continue;

      if (!AVISA_POR_TABELA.some((sinal) => fonte.includes(sinal))) {
        esquecidos.push(relativo);
      }
    }

    expect(
      esquecidos,
      "Estes arquivos gravam no banco e não avisam o cache das telas. " +
        "Chame limpaCache() depois da escrita (ou use useVoltarAposCriar), " +
        "ou acrescente o arquivo à lista FORA explicando por quê:\n" +
        esquecidos.map((f) => `  - ${f}`).join("\n"),
    ).toEqual([]);
  });
});
