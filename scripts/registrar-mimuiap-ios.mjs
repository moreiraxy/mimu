/**
 * Põe o MimuIAP de volta na lista de plugins que o Capacitor carrega.
 *
 * POR QUE ISTO EXISTE
 *
 * O `cap sync` gera `packageClassList` a partir dos PACOTES NPM instalados. O
 * MimuIAP não é pacote: ele entra por referência de arquivos no alvo do Xcode,
 * porque `ios/` é versionado neste repositório e uma cópia dentro dele viraria
 * uma segunda fonte do mesmo código. Então o sync o descarta, toda vez.
 *
 * O QUE ISSO CAUSOU
 *
 * O primeiro build enviado à App Store (11/09/2026) não conseguia comprar
 * nada. A classe ESTAVA no binário — conferida com `otool -ov`, conformando
 * com CAPBridgedPlugin e expondo `comprar:` —, mas o Capacitor nunca a
 * instanciava, porque ela não estava nesta lista.
 *
 * O sintoma enganava: `registerPlugin` cria `window.MimuIAP` do lado JS de
 * qualquer jeito, então `caminhoDeCompra()` respondia "iap", o botão aparecia,
 * e o toque morria com «"MimuIAP" plugin is not implemented on iOS».
 *
 * Rode DEPOIS de `cap sync` — é o que `npm run sync:ios` faz. O teste
 * `testes/plugin-iap-registrado.test.ts` falha se esta lista perder o plugin.
 */
import { readFileSync, writeFileSync } from "node:fs";

const CAMINHO = "ios/App/App/capacitor.config.json";
const CLASSE = "MimuIAP";

const config = JSON.parse(readFileSync(CAMINHO, "utf8"));
const lista = config.packageClassList ?? [];

if (lista.includes(CLASSE)) {
  console.log(`${CLASSE} já estava registrado — nada a fazer.`);
  process.exit(0);
}

config.packageClassList = [...lista, CLASSE];
writeFileSync(CAMINHO, JSON.stringify(config, null, "\t") + "\n");
console.log(`${CLASSE} registrado em ${CAMINHO} (${config.packageClassList.length} plugins).`);
