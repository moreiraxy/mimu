import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

/**
 * Toda API que o iOS protege precisa da sua chave no Info.plist.
 *
 * Sem a chave o sistema não devolve erro: ele ENCERRA o processo. Não há
 * exceção em JavaScript, não há aviso no console — o app simplesmente some da
 * tela, e quem está usando acha que travou.
 *
 * Isto já aconteceu DUAS vezes neste projeto:
 *
 *   - o ditado (`getUserMedia`) derrubava o app por falta de
 *     NSMicrophoneUsageDescription;
 *   - o envio do logo (`<input type="file" accept="image/*">`) derrubava o app
 *     ao tocar em "Tirar foto ou vídeo", por falta de NSCameraUsageDescription.
 *     Foi assim que a revisão da Apple reprovou o build 2 pela diretriz 2.1(a).
 *
 * As duas passaram por build, assinatura, envio e instalação sem um ruído.
 * Este teste procura no CÓDIGO o que exige permissão e cobra a chave.
 */

const INFO_PLIST = "ios/App/App/Info.plist";

/** O que buscar no código, e a chave que o iOS exige de quem faz isso. */
const EXIGENCIAS = [
  {
    nome: "câmera (input de arquivo com accept de imagem)",
    padrao: 'accept="image/',
    chaves: ["NSCameraUsageDescription", "NSPhotoLibraryUsageDescription"],
  },
  {
    nome: "microfone (getUserMedia com áudio)",
    padrao: "getUserMedia",
    chaves: ["NSMicrophoneUsageDescription"],
  },
];

function usadoNoCodigo(padrao: string): boolean {
  try {
    // `grep -r` sai com 1 quando não acha nada; o catch cobre esse caso.
    execSync(
      `grep -rql --include=*.tsx --include=*.ts ${JSON.stringify(padrao)} app components hooks lib`,
      { stdio: ["ignore", "pipe", "ignore"] },
    );
    return true;
  } catch {
    return false;
  }
}

describe("o que pede permissão está declarado no Info.plist", () => {
  for (const { nome, padrao, chaves } of EXIGENCIAS) {
    it(`${nome} tem as chaves que o iOS exige`, () => {
      if (!existsSync(INFO_PLIST)) {
        // `ios/` é gerado por `npx cap add ios` e pode não existir numa
        // máquina que só roda os testes.
        return;
      }
      if (!usadoNoCodigo(padrao)) {
        // O recurso saiu do produto: nada a cobrar.
        return;
      }

      const plist = readFileSync(INFO_PLIST, "utf8");
      for (const chave of chaves) {
        expect(
          plist,
          `${chave} falta no Info.plist, e o código usa ${nome}. ` +
            `Sem ela o iOS ENCERRA o app quando a pessoa toca — sem erro, sem aviso.`,
        ).toContain(chave);
      }
    });
  }

  it("as descrições não estão vazias", () => {
    if (!existsSync(INFO_PLIST)) return;
    const plist = readFileSync(INFO_PLIST, "utf8");

    // Uma string vazia satisfaz o `toContain` acima e a Apple recusa mesmo
    // assim: a diretriz 5.1.1 exige explicar POR QUE o recurso é necessário.
    for (const achado of plist.matchAll(
      /<key>(NS\w*UsageDescription)<\/key>\s*<string>([^<]*)<\/string>/g,
    )) {
      const chave = achado[1] ?? "?";
      const valor = achado[2] ?? "";
      expect(
        valor.trim().length,
        `${chave} tem descrição vazia ou curta demais — a diretriz 5.1.1 exige explicar POR QUE o recurso é necessário.`,
      ).toBeGreaterThan(10);
    }
  });
});
