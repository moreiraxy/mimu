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

describe("a porta de sair da conta", () => {
  it("o Sair continua na tela de Perfil", () => {
    expect(PERFIL).toContain('label="Sair"');
  });

  it("a régua leva ao Perfil, que é onde se sai da conta", () => {
    // `destinos` recebe o menu inteiro e o Perfil está nele com `modulo: null`
    // (ver components/dashboard/navItems.ts), então basta a régua renderizar a
    // lista. O que este teste trava é a régua NÃO filtrar o Perfil fora.
    expect(REGUA).toContain("destinos");
    expect(REGUA).not.toContain('!== "/minha-empresa"');
  });

  it("a régua também abre a folha do menu, onde ficam admin e avisos", () => {
    expect(REGUA).toContain("aoAbrirMenu");
    expect(BARRA).toContain("aoAbrirMenu={() => setMenuAberto(true)}");
  });
});
