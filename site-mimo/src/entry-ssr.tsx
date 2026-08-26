import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router";
import { Writable } from "node:stream";
import { Rotas } from "./Rotas";

/**
 * Renderiza uma rota do site para HTML, no build, sem navegador.
 *
 * Existe porque a landing é uma SPA: o HTML que saía do Vite tinha um `<div
 * id="root">` vazio, e todo o texto só nascia depois do React rodar. Pessoa
 * enxerga; buscador não. Medido em produção, a página entregava ZERO caractere
 * de texto para quem lê HTML cru — enquanto renderizada tem quase 7 mil.
 *
 * Não é servidor: isto roda uma vez, no build, e o resultado vira arquivo
 * estático. Em produção continua tudo HTML servido pelo Next, sem Node
 * renderizando React a cada visita.
 *
 * Também NÃO é hidratação. O cliente segue com `createRoot`, que substitui o
 * conteúdo ao montar. É proposital: hidratar exigiria que servidor e navegador
 * produzissem markup idêntico, e este site é feito de animação, medição de
 * elemento e preferência de movimento — fonte farta de divergência. O que se
 * quer aqui é o texto existir no HTML; o desenho continua sendo do cliente.
 */

/**
 * `renderToPipeableStream` e não `renderToString`.
 *
 * As rotas de história e de documento legal são carregadas com `lazy`, e o
 * `renderToString` não espera promessa: ele desiste no primeiro Suspense e
 * devolve o fallback, que aqui é `null`. Ou seja, justamente as páginas de
 * conteúdo sairiam vazias — o problema que este arquivo existe para resolver.
 *
 * O stream espera todo mundo resolver (`onAllReady`) antes de deixar escrever.
 */
export function render(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = "";
    let deuErro: unknown = null;

    const destino = new Writable({
      write(pedaco, _codificacao, callback) {
        html += pedaco.toString();
        callback();
      },
      final(callback) {
        callback();
        resolve(html);
      },
    });

    const stream = renderToPipeableStream(
      <StaticRouter location={url}>
        <Rotas />
      </StaticRouter>,
      {
        onAllReady() {
          // Só aqui todo lazy já resolveu. Antes disso o HTML estaria pela
          // metade, com o buraco exatamente onde está o conteúdo.
          if (deuErro) {
            reject(deuErro);
            return;
          }
          stream.pipe(destino);
        },
        onError(erro) {
          // Guardado em vez de lançado na hora: o React chama isto durante o
          // render, e lançar aqui derrubaria o stream antes de dar para dizer
          // QUAL rota falhou.
          deuErro = erro;
        },
      },
    );
  });
}

/**
 * Os dados das rotas, reexportados daqui.
 *
 * O script de prerender precisa saber quais histórias e quais documentos
 * legais existem para gerar um arquivo de cada. Ele poderia importar os `.ts`
 * direto, mas aí precisaria de um compilador próprio de TypeScript; saindo por
 * este mesmo pacote, ele lê JavaScript já compilado pelo Vite.
 */
export { STORIES } from "./data/customerStories";
export { LEGAL } from "./data/legal";
