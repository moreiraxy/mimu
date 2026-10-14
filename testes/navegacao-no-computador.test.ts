import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/*
 * A navegação do computador não pode sumir junto com a do celular.
 *
 * A barra de baixo virou `md:hidden` para a régua lateral assumir em tela
 * larga. Isso criou uma dependência silenciosa: TUDO que só existia dentro
 * daquela barra desaparece no computador se a régua não oferecer.
 *
 * E uma dessas coisas é o SAIR DA CONTA. O "Sair" do app vive na tela de
 * Perfil (`app/(dashboard)/minha-empresa/page.tsx`) — `SignOutButton` não é
 * usado em lugar nenhum. Então a régua precisa levar ao Perfil, senão quem
 * entra pelo computador fica trancado dentro da conta, e isso não aparece em
 * build, em tipo nem em tela: aparece no dia em que alguém precisa trocar de
 * conta.
 *
 * (Escrevi este teste primeiro afirmando que o "Sair" morava na folha do menu.
 * Ele falhou e estava certo em falhar: eu havia lido a saída de um grep de dois
 * arquivos como se fosse de um só.)
 *
 * O teste lê o código-fonte de propósito. O que ele protege é a LIGAÇÃO entre
 * três arquivos, e é justamente ela que uma refatoração desfaz sem perceber.
 */

const RAIZ = process.cwd();

function ler(caminho: string): string {
  return readFileSync(join(RAIZ, caminho), "utf8");
}

const BARRA = ler("components/dashboard/BottomNav.tsx");
const REGUA = ler("components/dashboard/NavLateral.tsx");
const PERFIL = ler("app/(dashboard)/minha-empresa/page.tsx");
const LAYOUT = ler("app/(dashboard)/layout.tsx");

describe("quem navega no computador", () => {
  it("a barra de baixo é só do celular", () => {
    expect(BARRA).toContain("md:hidden");
  });

  it("a régua lateral existe e é montada pela barra", () => {
    expect(BARRA).toContain("<NavLateral");
    expect(REGUA).toContain("export function NavLateral");
  });

  it("a régua aparece a partir de md e não antes", () => {
    // `hidden md:flex`: abaixo de md quem manda é a barra de baixo, desenhada
    // para o polegar. Régua em tela de celular come largura de conteúdo.
    expect(REGUA).toContain("hidden");
    expect(REGUA).toContain("md:flex");
  });

  it("o layout reserva a faixa da régua", () => {
    // Sem isto o conteúdo passa POR BAIXO da régua, e o primeiro cartão de
    // cada tela fica metade escondido.
    expect(LAYOUT).toMatch(/md:pl-\[\d+px\]/);
    expect(LAYOUT).toMatch(/lg:pl-\[\d+px\]/);
  });
});

describe("o que não é do posto sai da navegação", () => {
  const NAV = ler("components/dashboard/navItems.ts");

  it("Metas e a Home de salão saem para quem tem o posto", () => {
    // "metas?? para que? eu por acaso tenho?? tire" — as metas dela são os
    // seis indicadores do cargo, que vivem no posto.
    // A lista cresce conforme ela aponta o que não é dela; o teste cobra os
    // dois primeiros itens, que são decisão fechada.
    expect(NAV).toContain('const FORA_DO_POSTO = ["/dashboard", "/metas"');
    expect(NAV).toContain("FORA_DO_POSTO.includes(item.href)");
  });

  it("Clientes vira Leads, e os dois nunca aparecem juntos", () => {
    // "clientes fiados?? clientes?? (…) muda para leads". /leads é a mesma
    // tabela com a pergunta certa; /clientes continua existindo para as contas
    // de salão, que têm fiado e cliente fiel de verdade.
    expect(NAV).toContain('"/clientes"');
    expect(NAV).toContain('const SO_COM_POSTO = ["/leads"]');
    expect(NAV).toContain("SO_COM_POSTO.includes(item.href)");
    // A porta também precisa estar trancada pelo módulo, não só escondida.
    expect(ler("lib/rotas-modulos.ts")).toContain('"/leads": "clientes"');
  });

  it("dá para apagar uma pessoa — não dava", () => {
    // "e eu n posso APAGAR?? loucura isso". Não havia exclusão em lugar
    // nenhum: nem no hook, nem na tela de detalhe.
    expect(ler("hooks/useClientes.ts")).toContain("const excluir = useCallback");
    expect(ler("app/(dashboard)/leads/page.tsx")).toContain("ConfirmDialog");
  });

  it("a paleta sem cor é ligada por quem tem o posto", () => {
    // "pode ser no preto e branco e tirar essas cores q eu ODIEI".
    expect(LAYOUT).toContain('data-paleta={modulos.includes("posto")');
    expect(ler("app/globals.css")).toContain('[data-paleta="grafite"]');
  });

  it("o papel de parede não pinta de néon quem pediu grafite", () => {
    // O primeiro corte da paleta deixou "uns resquícios de verde" — palavras
    // dela. Não eram os cartões: era o FUNDO. `rgb(204 255 0)` e
    // `rgb(45 190 140)` estavam escritos à mão em 38 lugares do globals.css,
    // pintando as manchas de luz de toda tela do app.
    // Sem os comentários: o de cima cita os dois valores de propósito, para
    // o próximo leitor saber o que estava aqui. Comentário não pinta nada.
    const CSS = ler("app/globals.css").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(CSS).not.toMatch(/rgb\(204 255 0/);
    expect(CSS).not.toMatch(/rgb\(45 190 140/);
    expect(CSS).toContain("--luz-a");
    expect(CSS).toContain("--luz-b");
  });

  it("o traço do logo acompanha o preenchimento", () => {
    // Era `#0A0A0A` cravado, por uma razão correta (branco sobre néon não se
    // lê). Na paleta grafite o preenchimento é quase preto, e aí preto sobre
    // preto desaparece do mesmo jeito.
    expect(ler("components/Logo.tsx")).toContain(
      'stroke="rgb(var(--primary-text))"',
    );
  });

  it("as cores de preenchimento são variáveis, senão a paleta não alcança", () => {
    // Enquanto #CCFF00 estava cravado no tailwind.config, nenhuma paleta
    // conseguia trocá-lo: era hex dentro do CSS gerado.
    const TW = ler("tailwind.config.ts");
    for (const nome of ["--primary", "--verde", "--ambar", "--erro"]) {
      expect(TW, nome).toContain(`rgb(var(${nome}) / <alpha-value>)`);
    }
  });
});

describe("a porta de sair da conta", () => {
  it("o Sair continua na tela de Perfil", () => {
    expect(PERFIL).toContain('label="Sair"');
  });

  it("a régua leva ao Perfil, que é onde se sai da conta", () => {
    // O Perfil SAIU dos destinos — "perfil assinaturas relatar problemas (…)
    // NAO FAZ PARTE DO MEU DASH" — e virou o pé da régua, como conta e não
    // como seção. O que este teste trava é ele continuar alcançável: é lá que
    // está o "Sair" e o liga/desliga de módulo, que desfaz tudo isto.
    expect(REGUA).toContain('href="/minha-empresa"');
  });

  it("a régua também abre a folha do menu, onde ficam admin e avisos", () => {
    expect(REGUA).toContain("aoAbrirMenu");
    expect(BARRA).toContain("aoAbrirMenu={() => setMenuAberto(true)}");
  });
});
