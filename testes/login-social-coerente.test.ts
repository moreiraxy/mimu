import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ORDEM_DOS_PROVEDORES,
  PROVEDOR_LIGADO,
  ROTULO_DO_PROVEDOR,
  provedoresDisponiveis,
  temLoginSocial,
} from "@/lib/login-social";

/*
 * Os botões de Apple e Google estão escritos e desligados, esperando as
 * credenciais (ver lib/login-social.ts). Este teste guarda as duas pontas
 * dessa promessa.
 *
 * Ele NÃO exige que fiquem desligados para sempre — o dia de ligar é o
 * objetivo. O que ele exige é que ligar seja coerente: um provedor ligado
 * precisa ter rótulo, precisa aparecer na ordem, e a rota que recebe a volta
 * do provedor precisa existir. Botão que abre um login e volta para lugar
 * nenhum é o pior dos dois mundos.
 */

describe("login social", () => {
  it("não desenha botão de provedor que não está configurado", () => {
    for (const provedor of ORDEM_DOS_PROVEDORES) {
      if (!PROVEDOR_LIGADO[provedor]) {
        expect(provedoresDisponiveis()).not.toContain(provedor);
      }
    }

    expect(temLoginSocial()).toBe(provedoresDisponiveis().length > 0);
  });

  it("todo provedor tem rótulo e lugar na ordem", () => {
    for (const provedor of Object.keys(PROVEDOR_LIGADO) as Array<
      keyof typeof PROVEDOR_LIGADO
    >) {
      expect(
        ROTULO_DO_PROVEDOR[provedor],
        `${provedor} está sem rótulo: o botão sairia vazio`,
      ).toBeTruthy();
      expect(
        ORDEM_DOS_PROVEDORES,
        `${provedor} não está na ordem: ligar não faria ele aparecer`,
      ).toContain(provedor);
    }
  });

  it("a rota que recebe a volta do provedor existe", () => {
    /*
     * O provedor não devolve uma sessão, devolve um código — e alguém precisa
     * trocá-lo. Sem esta rota, quem entrasse com o Google voltaria deslogada e
     * o middleware a mandaria para o login: um laço que, de fora, parece o
     * botão não funcionar.
     */
    const rota = join(process.cwd(), "app/auth/callback/route.ts");
    const codigo = readFileSync(rota, "utf-8");
    expect(codigo).toContain("exchangeCodeForSession");
  });
});
