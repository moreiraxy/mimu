import type { Metadata } from 'next';
import './merge.css';

export const metadata: Metadata = {
  title: 'Interno · Mesclagem dos sites da Mimu',
  // Página de trabalho da equipe: fora do índice e sem seguir links.
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="doc">
      <span className="doc__tag">Documento interno</span>
      <h1>Mesclagem dos dois sites da Mimu</h1>
      <p className="doc__sub">
        O que existe hoje no repositório, de onde cada parte veio e o que precisa
        ser reconciliado para virar um site só.
      </p>

      <div className="doc__aviso">
        <strong>Esta página não é pública.</strong> Está marcada com{' '}
        <code>noindex, nofollow</code> e não é linkada de nenhuma seção da
        landing. Ela vive dentro do <code>site-v2</code> só porque era onde dava
        para publicá-la sem tocar no app.
      </div>

      <h2>O mapa: três coisas diferentes no mesmo repositório</h2>
      <p>
        A branch <code>v2</code> tem três bases de código que se parecem, mas não
        são a mesma coisa. Confundi-las é o erro mais fácil de cometer aqui.
      </p>

      <div className="doc__scroll">
        <table>
          <thead>
            <tr>
              <th>Onde</th>
              <th>O que é</th>
              <th>Stack</th>
              <th>Mexer?</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>app/</code>, <code>components/</code>, <code>lib/</code>
              </td>
              <td>
                O <strong>produto</strong> — o PWA da Mimu (auth, dashboard,
                API, Supabase). Inclui a landing atual em{' '}
                <code>app/(marketing)</code>.
              </td>
              <td>Next 14 · React 18 · Tailwind 3</td>
              <td>
                <strong>Não.</strong> Fora do escopo da mesclagem.
              </td>
            </tr>
            <tr>
              <td>
                <code>site-v2/</code>
              </td>
              <td>
                Clone do site da Pierre, reconstruído em React e já rebrandado
                para a Mimu (cores, tipografia, logo, tema claro).
              </td>
              <td>Next 16 · React 19 · CSS do Webflow</td>
              <td>Sim — é um dos dois lados.</td>
            </tr>
            <tr>
              <td>
                <code>site-mimo/</code>
              </td>
              <td>
                Base <code>payflow-clone</code>, usada como ponto de partida do
                site da Mimu. 14 seções próprias.
              </td>
              <td>Vite 8 · React 19 · Tailwind 4 · react-router 8</td>
              <td>Sim — é o outro lado.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Como rodar cada um</h2>
      <p>
        São projetos independentes, cada um com o próprio{' '}
        <code>package.json</code> e <code>node_modules</code>. Nenhum dos dois é
        compilado pelo build da raiz — ambos estão excluídos do{' '}
        <code>tsconfig.json</code> e do <code>.prettierignore</code> do repo,
        para o <code>typecheck</code> do app não tentar compilar código de React
        19.
      </p>
      <ul>
        <li>
          <code>cd site-v2 &amp;&amp; npm install &amp;&amp; npm run dev</code>
        </li>
        <li>
          <code>cd site-mimo &amp;&amp; bun install &amp;&amp; bun run dev</code>{' '}
          — usa <code>bun.lock</code>
        </li>
      </ul>
      <p>
        Escolha portas explícitas ao subir os dois juntos: a 3000 e a 3001 já
        costumam estar ocupadas por outros projetos na máquina.
      </p>

      <h2>O que precisa ser reconciliado</h2>

      <h3>1. Estilização — a decisão que manda em todo o resto</h3>
      <p>
        Os dois lados resolvem CSS de formas incompatíveis. O{' '}
        <code>site-mimo</code> é Tailwind 4 utilitário. O <code>site-v2</code> é
        um <code>webflow.css</code> de <strong>10.628 linhas</strong>, gerado a
        partir do clone por <code>site-v2/tools/convert.mjs</code>, com um
        sistema próprio de tokens (<code>--swatch--*</code>,{' '}
        <code>--_theme---*</code>) e temas em classe (<code>.u-theme-light</code>
        ).
      </p>
      <p>
        Não dá para misturar os dois no mesmo documento sem conflito: o preflight
        do Tailwind e o reset do Webflow disputam os mesmos seletores. É preciso
        escolher um dos dois como base do site final e portar as seções do outro.
      </p>

      <h3>2. O site-v2 depende de globais de runtime</h3>
      <p>
        Este é o obstáculo técnico mais concreto. As animações do{' '}
        <code>site-v2</code> ficam em <code>components/behaviors/</code> e
        chamam bibliotecas como variáveis globais dentro de{' '}
        <code>useEffect</code> — <code>new Lenis(...)</code>,{' '}
        <code>gsap.timeline()</code>, <code>QRCodeStyling</code>. Elas existem
        porque sete vendors (jQuery, runtime do Webflow, GSAP, Lenis) são
        carregados com <code>strategy=&quot;beforeInteractive&quot;</code> no
        root layout.
      </p>
      <p>Duas consequências para quem for mesclar:</p>
      <ul>
        <li>
          <code>beforeInteractive</code> só funciona no{' '}
          <strong>root layout</strong> de um app Next. Mover essas seções para
          dentro de outro app, como rota aninhada, faz os vendors carregarem
          tarde e as animações quebrarem com <code>ReferenceError</code>.
        </li>
        <li>
          Se o site final for Vite (<code>site-mimo</code>), esses scripts
          precisam entrar no <code>index.html</code> antes do bundle — ou os
          behaviors precisam ser reescritos com imports de verdade. O{' '}
          <code>site-mimo</code> já usa <code>lenis</code> como dependência npm,
          então esse pedaço tem caminho fácil; jQuery e o runtime do Webflow,
          não.
        </li>
      </ul>

      <h3>3. Tipografia e marca já estão alinhadas</h3>
      <p>
        A parte de identidade visual não deve dar trabalho. O rebrand do{' '}
        <code>site-v2</code> está isolado em{' '}
        <code>site-v2/app/mimu-brand.css</code>, um arquivo só, que sobrescreve
        os tokens do Webflow com a paleta da Mimu (coral <code>#FF6B5B</code>,
        escuro <code>#1E1E2E</code>, fundo <code>#F7F6F3</code>) e as fontes
        Nunito e Space Grotesk. As mesmas cores estão em{' '}
        <code>tailwind.config.ts</code> na raiz, que é a referência do app.
      </p>

      <h3>4. O site-v2 tem conteúdo que não é da Mimu</h3>
      <p>
        O rebrand foi <strong>visual</strong>. O texto ainda é o da Pierre, e
        parte dele não pode simplesmente ter o nome trocado:
      </p>
      <ul>
        <li>
          <strong>Seção de imprensa</strong> (<code>section-10</code>): citações
          reais de Exame, Terra e Finsiders sobre a Pierre, com links para as
          matérias. Trocar o nome fabricaria cobertura de imprensa que não
          existe. Remover, ou substituir por cobertura real da Mimu.
        </li>
        <li>
          <strong>FAQ</strong> (<code>section-08</code>): afirma autorização do
          Banco Central e operação via Open Finance com mais de 100 instituições.
          É a situação regulatória da Pierre.
        </li>
        <li>
          <strong>Links vivos</strong>: <code>pierre.finance/login</code> (3×),{' '}
          <code>one.pierre.finance</code>, e o QR code de download aponta para{' '}
          <code>pierre.onelink.me</code>.
        </li>
        <li>
          <strong>Ilustrações raster</strong> em <code>.webp</code> ainda são
          telas do app da Pierre, em tema escuro. Os SVGs já foram convertidos
          para o tema claro; bitmap precisa ser reexportado.
        </li>
      </ul>

      <h3>5. O gerador do site-v2 deixou de ser reexecutável</h3>
      <p>
        <code>site-v2/tools/gen-app.mjs</code> gera <code>app/layout.tsx</code>,{' '}
        <code>components/nav.tsx</code> e <code>components/footer.tsx</code> a
        partir do clone original. Depois do rebrand, rodá-lo de novo desfaz o
        logo da Mimu e a metadata. Trate-o como bootstrap de uma vez só, não como
        parte do build.
      </p>

      <h2>Inventário de seções</h2>
      <div className="doc__scroll">
        <table>
          <thead>
            <tr>
              <th>
                <code>site-v2</code> (10 seções)
              </th>
              <th>
                <code>site-mimo</code> (14 seções)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>components/sections/section-01</code> a{' '}
                <code>section-10</code>, mais <code>nav</code>,{' '}
                <code>footer</code> e <code>chrome</code>. Nomes genéricos: o
                conteúdo tem que ser aberto para saber o que é cada uma.
              </td>
              <td>
                <code>src/sections/</code>: Hero, Logos, Features, HowItWorks,
                WhoWeServe, Stats, Integrations, Security, Pricing, Testimonials,
                CustomerStories, Faqs, Cta, Footer. Nomeadas por propósito.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        O <code>site-mimo</code> tem <code>docs/SPEC.md</code>,{' '}
        <code>docs/PLAN.md</code> e <code>docs/BREAKPOINTS.md</code> — vale ler
        antes de decidir o que sobrevive de cada lado.
      </p>

      <h2>Peso no repositório</h2>
      <p>
        <code>site-mimo/public/img</code> tem <strong>30 MB</strong>: 183
        arquivos <code>.webp</code> e 183 <code>.avif</code> gerados, mais os
        originais em <code>.png</code> e <code>.jpg</code>. O <code>dist/</code>{' '}
        (35 MB) e o <code>node_modules</code> ficaram de fora da cópia. Se o site
        final não usar essas imagens, dá para recuperar bastante espaço apagando
        os derivados e mantendo só as fontes — <code>bun run images</code>{' '}
        regenera por <code>scripts/optimize-images.ts</code>.
      </p>
    </main>
  );
}
