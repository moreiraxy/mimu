import { prepararBancoLocal } from "./preparar-banco";

/**
 * Roda UMA vez, antes de todos os arquivos de teste.
 *
 * Estava dentro do `beforeAll` de cada arquivo, e os arquivos rodam em
 * paralelo: os dois disparavam os mesmos GRANT ao mesmo tempo e o Postgres
 * devolvia "tuple concurrently updated". Serializar os testes resolveria o
 * sintoma e custaria o paralelismo de todo o resto — preparar o banco uma vez
 * só resolve a causa.
 */
export default function setup() {
  prepararBancoLocal();
}
