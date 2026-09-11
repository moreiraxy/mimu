import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";

/**
 * O plugin de compra precisa estar na lista que o Capacitor carrega.
 *
 * Este teste existe por causa de um build que foi para a App Store sem
 * conseguir comprar nada. A classe MimuIAP estava compilada no binário, mas
 * ausente de `packageClassList` — e o Capacitor só instancia o que está lá.
 *
 * O sintoma não apontava para cá: `registerPlugin` cria `window.MimuIAP` do
 * lado JS mesmo sem nativo, então a tela mostrava o botão de compra e o toque
 * morria com «"MimuIAP" plugin is not implemented on iOS».
 *
 * `cap sync` REGERA essa lista a partir dos pacotes npm e descarta o MimuIAP,
 * que entra por referência de arquivos. `scripts/registrar-mimuiap-ios.mjs` o
 * repõe; este teste é quem percebe se alguém sincronizar e esquecer.
 */

const CAMINHO = "ios/App/App/capacitor.config.json";

describe("o plugin de compra está registrado no projeto iOS", () => {
  it("MimuIAP está em packageClassList", () => {
    if (!existsSync(CAMINHO)) {
      // `ios/` é gerado por `npx cap add ios` e pode não existir numa máquina
      // que só roda os testes. Sem projeto não há o que conferir.
      return;
    }

    const config = JSON.parse(readFileSync(CAMINHO, "utf8"));
    expect(
      config.packageClassList,
      "packageClassList sumiu do capacitor.config.json",
    ).toBeDefined();
    expect(
      config.packageClassList,
      "MimuIAP não está na lista: o Capacitor não vai carregar o plugin, e " +
        "nenhuma compra funciona. Rode `npm run sync:ios`.",
    ).toContain("MimuIAP");
  });

  it("os plugins que o sync gera continuam lá", () => {
    if (!existsSync(CAMINHO)) return;

    const config = JSON.parse(readFileSync(CAMINHO, "utf8"));
    // Se o script de registro tivesse SUBSTITUÍDO a lista em vez de somar a
    // ela, o app perderia splash, teclado, push e barra de status de uma vez.
    for (const classe of [
      "AppPlugin",
      "HapticsPlugin",
      "KeyboardPlugin",
      "PushNotificationsPlugin",
      "SplashScreenPlugin",
      "StatusBarPlugin",
    ]) {
      expect(config.packageClassList).toContain(classe);
    }
  });
});
