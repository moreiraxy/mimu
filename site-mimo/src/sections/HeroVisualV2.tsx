import type { ReactNode } from "react";
import { MimuMark } from "../components/Logo";
import { useInView } from "../hooks/useInView";
import { useScrollTilt } from "../hooks/useScrollTilt";

/**
 * Reorganização completa do visual do hero (pedido explícito: celular real —
 * corpo do site-v2, tela com o dashboard oficial da Mimu —, avatares com
 * iniciais no lugar dos avatares do Pierre, e os 4 cards laterais trocados
 * por alertas/insights reais do produto).
 *
 * O "iPhone do site-v2" não existe como componente CSS lá — a versão em
 * localhost:3100 é uma única imagem raster (com o mascote do Pierre
 * desenhado dentro da tela, por isso nunca deu pra reaproveitar o arquivo).
 * O celular realista de verdade — gradiente titânio, Dynamic Island, botões
 * laterais — já existe como CSS puro no app principal
 * (app/(marketing)/HeroSection.tsx), então é essa a peça portada aqui,
 * mantendo a mesma proporção fluida (%) que este arquivo já usava.
 *
 * data-speed do pedido (0.12–0.35) é a escala 0–1 do parallax do site-v2;
 * o hook daqui (useParallaxFloat.ts) já espera 0–100 em
 * `data-parallax-strength`, então os valores entram multiplicados por 100 —
 * mesma proporção relativa, escala do hook que já existe.
 */

const DIAS = [
  { label: "S", valor: 90 },
  { label: "T", valor: 130 },
  { label: "Q", valor: 110 },
  { label: "Q", valor: 180, hoje: true },
  { label: "S", valor: null },
  { label: "S", valor: null },
  { label: "D", valor: null },
] as const;
const FATURAMENTO_MAX = 200;

const AVATARES = [
  {
    iniciais: "AN",
    nome: "Andréia",
    cor: "bg-coral",
    // Verde neon é claro demais pra iniciais brancas — só este avatar (o
    // único em bg-coral/primary) precisa do texto preto.
    texto: "text-primary-text",
    className: "left-[-8%] top-[2%] sm:left-[-14%]",
    parallaxStrength: 30,
    floatSeconds: 3,
  },
  {
    iniciais: "CA",
    nome: "Carol",
    cor: "bg-verde",
    texto: "text-white",
    className: "right-[-6%] top-[6%] sm:right-[-12%]",
    parallaxStrength: 28,
    floatSeconds: 4,
  },
  {
    iniciais: "MG",
    nome: "Maria",
    cor: "bg-ambar",
    texto: "text-white",
    className: "left-[-2%] top-[80%] sm:left-[-8%]",
    parallaxStrength: 35,
    floatSeconds: 3.7,
  },
] as const;

/** Ícone check, mesmo traço fino usado no chip da esteira de Segurança. */
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.4" />
      <path d="M12 11v5.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="7.6" r="1.3" fill="currentColor" />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12.5 2 4 14h6.5L11 22l8.5-12H13z" fill="currentColor" />
    </svg>
  );
}

/**
 * Camada 1 (este nó): `data-parallax` — o hook escreve `transform` aqui a
 * cada frame de scroll. Camada 2: `animate-hero-float` via CSS puro, num nó
 * filho — precisa ser outro nó porque uma `animation` CSS e um
 * `style.transform` imperativo no mesmo elemento brigam pela mesma
 * propriedade. Camada 3: a entrada (opacity/translateY via IntersectionObserver),
 * num terceiro nó, pelo mesmo motivo.
 */
/**
 * Os quatro cards laterais só aparecem em `lg` (1200px+).
 *
 * O deslocamento deles é fixo em px (-225 a -260), medido pro desktop. Entre
 * 460px (onde ficavam visíveis antes) e 1200px a margem que sobra ao lado do
 * celular é bem menor que isso — em 460px são ~60px de folga pra um card que
 * pede 240px, então ele saía quase inteiro da tela.
 *
 * No celular eles agora aparecem encolhidos (58%) e ancorados na borda, com
 * `origin-left`/`origin-right` para a redução puxar o card PARA DENTRO da
 * tela em vez de deixá-lo sangrando pela lateral. Encavalam de leve o
 * aparelho, o que é o ponto: eles são o que a Mimu avisa, e sem eles a Hero
 * no celular era só um telefone parado.
 *
 * z-30 no mobile (contra z-10 no desktop) porque ali eles passam por cima do
 * aparelho; no desktop ficam ao lado e não disputam.
 */
function FloatCard({
  className,
  parallaxStrength,
  floatSeconds,
  floatDelay = 0,
  children,
}: {
  className: string;
  parallaxStrength: number;
  floatSeconds: number;
  floatDelay?: number;
  children: ReactNode;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      className={`absolute z-30 lg:z-10 ${className}`}
      data-parallax=""
      data-parallax-strength={parallaxStrength}
      data-parallax-pattern={2}
    >
      <div
        className="animate-hero-float"
        style={{ animationDuration: `${floatSeconds}s`, animationDelay: `${floatDelay}s` }}
      >
        <div
          ref={ref}
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "none" : "translateY(14px) scale(0.96)",
            transition: "opacity 500ms cubic-bezier(0.6,0,0.4,1), transform 500ms cubic-bezier(0.6,0,0.4,1)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function AvatarBubble({
  iniciais,
  nome,
  cor,
  texto,
  className,
  parallaxStrength,
  floatSeconds,
}: (typeof AVATARES)[number]) {
  return (
    <div
      className={`absolute z-10 hidden flex-col items-center gap-1.5 sm:flex ${className}`}
      data-parallax=""
      data-parallax-strength={parallaxStrength}
      data-parallax-pattern={2}
    >
      <div
        className="animate-hero-float flex flex-col items-center gap-1.5"
        style={{ animationDuration: `${floatSeconds}s` }}
      >
        <span
          className={`flex size-[54px] items-center justify-center rounded-full text-[15px] font-extrabold shadow-[0_4px_16px_rgba(30,30,46,0.15)] ${cor} ${texto}`}
        >
          {iniciais}
        </span>
        <div className="rounded-[10px_18px_18px] border border-borda bg-superficie px-3 py-1.5 text-sm font-semibold text-ink shadow-sm">
          {nome}
        </div>
      </div>
    </div>
  );
}

/** Tela do celular — o dashboard oficial da Mimu (app/(marketing)/HeroSection.tsx), com os tokens de cor traduzidos pro tema do site-mimo. */
/**
 * O cartão pequeno do painel, com o anel.
 *
 * O anel é grosso e ocupa perto de um terço da largura de propósito: é o que
 * o olho encontra primeiro, e o número embaixo é a legenda dele. Um ícone de
 * traço nesse lugar some dentro do cartão. Mesma decisão de
 * components/CartaoDado.tsx e components/graficos/Anel.tsx no app.
 */
// aspect-[169/196] é a proporção real do widget pequeno no app
// (CLASSES_TAMANHO em lib/widgets.ts): mais alto que largo. Sem ela o cartão
// fica achatado e o anel perde o peso que deveria ter.
function CartaoPequeno({
  rotulo,
  valor,
  progresso,
  cor,
}: {
  rotulo: string;
  valor: string;
  progresso: number;
  cor: string;
}) {
  // 2πr com r=14: o traço é desenhado como fração desta volta.
  const volta = 2 * Math.PI * 14;

  return (
    <div className="flex aspect-[169/196] flex-col justify-between rounded-[14px] border border-white/10 bg-white/[0.06] p-3">
      <svg width="46" height="46" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="14" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4.5" />
        <circle
          cx="16"
          cy="16"
          r="14"
          fill="none"
          stroke={cor}
          strokeWidth="4.5"
          strokeLinecap="round"
          strokeDasharray={`${(progresso / 100) * volta} ${volta}`}
          transform="rotate(-90 16 16)"
        />
      </svg>
      <div>
        <p className="text-[10px] leading-tight text-muted">{rotulo}</p>
        {/* Sem cor no número: quem carrega a cor é o anel. */}
        <p className="text-[13px] font-extrabold leading-tight text-ink">{valor}</p>
      </div>
    </div>
  );
}

/**
 * Um ícone da barra inferior, desenhado como silhueta.
 *
 * Não são os ícones do lucide que o app usa: a 12px o traço de 1,5px some, e
 * o que sobra é uma mancha cinza. Formas cheias leem melhor nesse tamanho e
 * dão a mesma informação — que ali existe uma barra de navegação com cinco
 * lugares e o do meio é a ação.
 */
function IconeNav({ forma, ativo }: { forma: "casa" | "agenda" | "grafico" | "mais"; ativo?: boolean }) {
  // O item ativo é da COR DA MARCA, não branco: no app é `text-primary-forte`
  // contra `text-neutro-icon` (components/dashboard/BottomNav.tsx).
  const cor = ativo ? "text-coral" : "text-muted";
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" className={cor} aria-hidden="true">
      {forma === "casa" && <path d="M7 1.5 1.5 6v6.5h4V9h3v3.5h4V6L7 1.5Z" fill="currentColor" />}
      {forma === "agenda" && (
        <>
          <rect x="1.5" y="3" width="11" height="9.5" rx="1.8" fill="currentColor" />
          <rect x="4" y="1" width="1.5" height="3" rx="0.7" fill="currentColor" />
          <rect x="8.5" y="1" width="1.5" height="3" rx="0.7" fill="currentColor" />
        </>
      )}
      {forma === "grafico" && (
        <>
          <rect x="1.5" y="7" width="2.6" height="5.5" rx="1" fill="currentColor" />
          <rect x="5.7" y="4" width="2.6" height="8.5" rx="1" fill="currentColor" />
          <rect x="9.9" y="1.5" width="2.6" height="11" rx="1" fill="currentColor" />
        </>
      )}
      {forma === "mais" && (
        <>
          <circle cx="2.5" cy="7" r="1.4" fill="currentColor" />
          <circle cx="7" cy="7" r="1.4" fill="currentColor" />
          <circle cx="11.5" cy="7" r="1.4" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

function TelaDoCelular() {
  return (
    <div
      className="absolute overflow-hidden bg-bg"
      style={{
        // Retângulo da tela medido na imagem do site-v2 (496x1021): margem
        // 20px nas laterais/topo, 18px embaixo — em % pra acompanhar
        // qualquer largura renderizada do contêiner.
        left: "4.03%",
        top: "1.96%",
        width: "91.94%",
        height: "96.28%",
        // Raio medido (~46px na imagem-fonte) como par horizontal/vertical
        // — % simples distorceria a curva, já que a tela é bem mais alta
        // que larga.
        borderRadius: "10.09% / 4.68%",
      }}
    >
      {/* barra de status: altura fixa em % da tela, ancorada por `inset`. Um
          `flex-1` dentro de uma cadeia de alturas percentuais
          (aspect-ratio → h-full → h-full) não resolve igual em todo
          navegador. */}
      <div className="absolute inset-x-0 top-0 flex h-[8%] items-center justify-between px-5">
        <p className="text-[11px] font-bold text-ink">9:41</p>
        <div className="flex items-center gap-[4px]">
          <svg width="13" height="10" viewBox="0 0 16 12" fill="none">
            <path d="M1 4.5 Q8 -1 15 4.5" stroke="#FFFFFF" strokeWidth={1.4} fill="none" strokeLinecap="round" />
            <path d="M4 7 Q8 3.5 12 7" stroke="#FFFFFF" strokeWidth={1.4} fill="none" strokeLinecap="round" />
            <circle cx="8" cy="9.5" r="1.1" fill="#FFFFFF" />
          </svg>
          <div className="box-border h-[9px] w-[19px] rounded-[2px] border border-ink p-[1px]">
            <div className="h-full w-3/4 rounded-[1px] bg-ink" />
          </div>
        </div>
      </div>

      {/*
        O PAINEL AQUI ESPELHA app/(dashboard)/dashboard/, e precisa ser
        conferido contra ele quando o app mudar.

        Esta tela é desenhada à mão, não é screenshot — e por isso envelhece
        sem avisar. Ficou três semanas mostrando a interface anterior: o painel
        virou grade de widgets em vidro no commit 3c10b20 (01/09/2026, 155
        arquivos) e a landing seguiu desenhando o layout de 10/08, com um
        cartão coral cheio e os números pintados de verde e âmbar.

        O que se espelha, e de onde:

          grade      2 colunas; widget "médio" ocupa as duas
                     (CLASSES_TAMANHO em lib/widgets.ts)
          ordem      hoje · a-receber · a-pagar · faturamento · agenda ·
                     avisos (PAINEL_PADRAO — o que uma conta nova vê)
          "hoje"     rótulo miúdo, valor grande, barra fina, linha de apoio
                     (CartaoDeHoje.tsx)
          pequenos   anel grosso no topo, rótulo, valor
                     (components/CartaoDado.tsx)
          cor        só no anel e na barra. O NÚMERO NUNCA É COLORIDO — está
                     escrito em page.tsx por quê: pintar anel e número diz a
                     mesma coisa duas vezes.

        O vidro do app é branco translúcido sobre fundo escuro
        (--vidro-fundo: 255 255 255 nos dois temas). Aqui vira white/[0.06]
        com borda white/10 — mesma leitura, com os tokens desta landing.
      */}
      <div className="absolute inset-x-0 bottom-[9%] top-[8%] flex flex-col gap-3 overflow-hidden px-4 pt-3">
        {/* Cabeçalho: retrato, saudação e a marca — como em HeroHome.tsx. */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex size-[22px] items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-ink">
              A
            </span>
            <div>
              <p className="text-[10px] leading-tight text-muted">Bom dia,</p>
              <p className="text-[13px] font-extrabold leading-tight text-ink">
                Andréia
              </p>
            </div>
          </div>
          <span className="flex size-[26px] items-center justify-center rounded-[9px] bg-coral">
            <MimuMark className="size-3 text-primary-text" />
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* "Hoje" — médio. */}
          <div className="col-span-2 rounded-[14px] border border-white/10 bg-white/[0.06] p-3">
            <p className="text-[10px] leading-tight text-muted">
              Faturamento de hoje
            </p>
            <p className="mt-0.5 text-[24px] font-bold leading-none tracking-tight text-ink">
              R$ 410
            </p>
            {/* A barra fina é onde a cor da marca aparece neste widget —
                traço, não área. */}
            <div className="mt-2 h-[4px] w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[82%] rounded-full bg-coral" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-[10px] text-muted">Meta do dia</span>
              <span className="text-[10px] font-bold text-ink">R$ 500</span>
            </div>
          </div>

          {/* Os dois pequenos, com o anel carregando a cor. */}
          <CartaoPequeno rotulo="A receber" valor="R$ 240" progresso={57} cor="var(--color-verde)" />
          <CartaoPequeno rotulo="A pagar" valor="R$ 180" progresso={43} cor="var(--color-ambar)" />

          {/* "Faturamento" — médio. No app é o gráfico da semana
              (CartaoResumoFaturamento.tsx); aqui, sete barras, que é o que se
              lê num celular deste tamanho. */}
          <div className="col-span-2 rounded-[14px] border border-white/10 bg-white/[0.06] p-3">
            <p className="text-[10px] leading-tight text-muted">
              Faturamento na semana
            </p>
            <div className="mt-1.5 flex h-[40px] items-end gap-1.5">
              {[38, 52, 44, 70, 58, 88, 64].map((altura, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-[2px] ${i === 5 ? "bg-coral" : "bg-white/20"}`}
                  style={{ height: `${altura}%` }}
                />
              ))}
            </div>
          </div>

          {/* Agenda — médio. */}
          <div className="col-span-2 rounded-[14px] border border-white/10 bg-white/[0.06] p-3">
            <p className="mb-1.5 text-[10px] text-muted">Agenda de hoje</p>
            <div className="mb-1 flex justify-between">
              <p className="text-[10px] text-ink">Maria · Escova</p>
              <p className="text-[10px] text-muted">14h</p>
            </div>
            <div className="flex justify-between">
              <p className="text-[10px] text-ink">Carol · Manicure</p>
              <p className="text-[10px] text-muted">16h</p>
            </div>
          </div>

          {/* "Avisos da Mimu" — médio, o último do painel padrão. */}
          <div className="col-span-2 rounded-[14px] border border-white/10 bg-white/[0.06] p-3">
            <div className="flex items-center gap-1.5">
              <span className="flex size-[14px] items-center justify-center rounded-[5px] bg-coral">
                <MimuMark className="size-2 text-primary-text" />
              </span>
              <p className="text-[10px] leading-tight text-muted">Avisos da Mimu</p>
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-ink">
              Maria te deve R$ 80 desde o dia 2.
            </p>
          </div>
        </div>
      </div>

      {/*
        A BARRA INFERIOR, que faltava aqui.

        O app tem navegação fixa no pé (components/dashboard/BottomNav.tsx):
        Home, Agenda, o botão de ação no centro, Financeiro e Mais. Sem ela o
        mockup mostrava um painel solto no vazio — e era o vazio que denunciava
        que aquilo não era o app.
      */}
      <div className="absolute inset-x-0 bottom-0 flex h-[9%] items-center justify-between border-t border-white/10 bg-white/[0.04] px-5 pb-1">
        <IconeNav forma="casa" ativo />
        <IconeNav forma="agenda" />
        <span className="flex size-[26px] items-center justify-center rounded-full bg-coral">
          <span className="mt-[-1px] text-[15px] font-bold leading-none text-primary-text">+</span>
        </span>
        <IconeNav forma="grafico" />
        <IconeNav forma="mais" />
      </div>
    </div>
  );
}

/**
 * Corpo do celular — pedido explícito: idêntico ao mockup do hero do site-v2
 * (localhost:3100), não a uma recriação em CSS. Esse mockup lá NÃO é um
 * componente — é uma imagem raster única
 * (site-v2/public/assets/img/..._home_header-agents-img-phone.webp) com a
 * tela do Pierre (mascote, "Converse com o Pierre") desenhada dentro dos
 * próprios pixels, então "copiar o componente" não existe como tarefa.
 *
 * O que dá pra copiar 1:1 é a carcaça: usei essa mesma imagem, com um furo
 * transparente recortado (Python/PIL, por fora deste código) exatamente no
 * retângulo da tela (medido pixel a pixel: 20/20/20px de margem nas laterais
 * e topo, 18px embaixo, raio 46px num arquivo de 496x1021) — moldura,
 * Dynamic Island, botões laterais e sombra continuam sendo os mesmos pixels
 * do site-v2. A tela da Mimu (real, sem o Pierre) fica atrás, revelada pelo
 * furo; a Dynamic Island é redesenhada por cima porque ela também caía
 * dentro do retângulo recortado.
 */
function Celular() {
  const tiltRef = useScrollTilt<HTMLDivElement>();

  return (
    <div
      className="relative mx-auto aspect-[496/1021] w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[400px]"
      data-parallax=""
      // 12 vinha do `data-speed="0.12"` do pedido original, quando só a Hero
      // tinha parallax; com o efeito no site inteiro ±2,6px sumia. 45 = ±10px,
      // o celular agora é a peça que mais anda da Hero (avatares 28–35), que
      // é o que se quer: ele é o objeto principal.
      data-parallax-strength={45}
      // Padrão 2 inverte o sentido: o aparelho SOBE enquanto a página desce.
      // Com o padrão 1 ele descia junto com o scroll, o que anula a sensação
      // de profundidade — parecia só um elemento preso na página.
      // Todo o hero usa o mesmo padrão de propósito: direções misturadas na
      // mesma cena leem como bug, não como camadas.
      data-parallax-pattern={2}
      style={{ perspective: 1000 }}
    >
      {/* nó 1: flutuação (CSS `animation`, translateY) */}
      <div className="animate-hero-float relative h-full w-full" style={{ animationDuration: "4s" }}>
        {/* nó 2: tilt 3D no scroll (`useScrollTilt` escreve rotateX/rotateY
            aqui via JS), precisa ser outro nó, senão a `animation` do pai
            e o `style.transform` imperativo do tilt brigam pela mesma
            propriedade no mesmo elemento. */}
        <div ref={tiltRef} className="relative h-full w-full">
          <TelaDoCelular />

          {/* Dynamic Island, medida na mesma imagem (x 174–312, y 31–71 de
              496x1021), redesenhada porque caiu dentro do furo da tela. */}
          <div className="absolute left-[35%] top-[3%] z-10 flex h-[4%] w-[28%] items-center justify-end rounded-full bg-black pr-[6%]">
            <div className="h-[22%] w-[8%] rounded-full bg-[#1a1a2e]" />
          </div>

          {/* Moldura real do site-v2, mesmos pixels: titânio, botões
              laterais, Dynamic Island (a do físico, agora só decorativa por
              baixo do furo) e sombra. `object-fit: fill` porque o
              contêiner já carrega o aspect-ratio nativo da imagem (496:1021),
              então não há letterboxing a corrigir. */}
          {/*
            A MOLDURA VAI EM WEBP, com o PNG de reserva.

            Ela é o arquivo mais pesado da landing inteira: 102 KB de uma
            página de 330 KB — quase um terço. Ficou de fora do sistema de
            imagens responsivas (não passa pelo <Img>, não está no manifesto de
            larguras), então era servida crua. Em WebP com alpha ela cai para
            7 KB.

            Medido antes de trocar: o canal alpha saiu bit a bit idêntico, e
            nos pixels VISÍVEIS a diferença de cor é de 1,12 em 255. A
            diferença grande que aparece numa comparação ingênua está nos 456
            mil pixels transparentes, onde a cor não é desenhada.

            `<picture>` e não só trocar a extensão: quem não suportar webp
            continua recebendo o PNG, que segue no disco.
          */}
          <picture>
            <source
              srcSet="/img/v2/iphone-frame-sitev2.webp"
              type="image/webp"
            />
            <img
              src="/img/v2/iphone-frame-sitev2.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 h-full w-full"
              style={{ objectFit: "fill" }}
            />
          </picture>
        </div>
      </div>
    </div>
  );
}

export function HeroVisualV2() {
  return (
    <div className="relative mx-auto mt-8 w-full max-w-[280px] sm:mt-16 sm:max-w-[340px] lg:max-w-[400px]">
      <Celular />

      {AVATARES.map((avatar) => (
        <AvatarBubble key={avatar.iniciais} {...avatar} />
      ))}

      {/* Lado esquerdo: rótulo estático + dois alertas independentes, cada
          um com a própria sombra, não agrupados num card só. */}
      <p className="absolute left-0 top-[20%] z-10 hidden w-[150px] text-[10px] font-bold uppercase tracking-[0.08em] text-muted lg:left-[-240px] lg:block">
        A Mimu te alerta
      </p>

      <FloatCard
        className="left-[-14px] top-[20%] origin-left scale-[0.74] sm:scale-[0.85] lg:left-[-240px] lg:top-[27%] lg:scale-100"
        parallaxStrength={25}
        floatSeconds={3}
      >
        <div className="flex w-[210px] items-start gap-2.5 rounded-[18px] border border-borda bg-superficie p-3.5 shadow-[0_4px_20px_rgba(30,30,46,0.07)]">
          <span className="flex size-[26px] flex-shrink-0 items-center justify-center rounded-full bg-verde">
            <CheckIcon className="text-white" />
          </span>
          <p className="text-[13px] leading-snug text-ink">
            Parabéns! Você bateu seu recorde de <strong className="font-extrabold">R$ 580</strong>
          </p>
        </div>
      </FloatCard>

      <FloatCard
        className="bottom-[16%] left-[-14px] origin-left scale-[0.74] sm:scale-[0.85] lg:bottom-auto lg:left-[-225px] lg:top-[46%] lg:scale-100"
        parallaxStrength={20}
        floatSeconds={3.5}
      >
        <div className="flex w-[196px] items-start gap-2.5 rounded-[18px] border border-borda bg-superficie p-3.5 shadow-[0_4px_20px_rgba(30,30,46,0.07)]">
          <span className="flex size-[26px] flex-shrink-0 items-center justify-center rounded-full bg-ambar">
            <InfoIcon className="text-white" />
          </span>
          <p className="text-[13px] leading-snug text-ink">
            Maria ainda te deve <strong className="font-extrabold">R$ 80</strong>
          </p>
        </div>
      </FloatCard>

      {/* Lado direito: faturamento semanal em cima, meta do dia embaixo. */}
      <FloatCard
        className="right-[-14px] top-[34%] origin-right scale-[0.74] sm:scale-[0.85] lg:right-[-260px] lg:top-[23%] lg:scale-100"
        parallaxStrength={18}
        floatSeconds={4.5}
      >
        <div className="w-[232px] rounded-[20px] border border-borda bg-superficie p-4 shadow-[0_4px_20px_rgba(30,30,46,0.07)]">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted">Faturamento semanal</p>
            <span className="text-[11px] font-bold text-verde">↑ 60%</span>
          </div>

          <div className="mt-2 flex justify-end">
            <span className="text-[9px] text-muted">R$ {FATURAMENTO_MAX}</span>
          </div>

          <div className="mt-1 flex items-end justify-between gap-1.5">
            {DIAS.map((dia, indice) => (
              <div key={indice} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-[56px] w-full items-end">
                  {dia.valor != null ? (
                    <div
                      className="w-full rounded-[4px] bg-verde"
                      style={{ height: `${(dia.valor / FATURAMENTO_MAX) * 100}%` }}
                    />
                  ) : (
                    <div className="h-full w-full rounded-[4px] border border-dashed border-borda" />
                  )}
                </div>
                <span className={`text-[9px] ${"hoje" in dia && dia.hoje ? "font-bold text-ink" : "text-muted"}`}>
                  {dia.label}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-1.5 border-t border-borda pt-2.5">
            <BoltIcon className="text-coral" />
            <span className="text-[10px] font-bold text-ink">Insights</span>
          </div>
        </div>
      </FloatCard>

      <FloatCard
        className="bottom-[2%] right-[-14px] origin-right scale-[0.74] sm:scale-[0.85] lg:right-[-225px] lg:scale-100"
        parallaxStrength={22}
        floatSeconds={5}
      >
        <div className="w-[196px] rounded-[20px] border border-borda bg-superficie p-4 shadow-[0_4px_20px_rgba(30,30,46,0.07)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.06em] text-muted">Meta do dia</p>
          <p className="mt-1.5 text-lg font-extrabold text-ink">82% concluída</p>
          <div className="mt-2.5 h-[7px] w-full rounded-md bg-borda">
            <div className="h-full w-[82%] rounded-md bg-coral" />
          </div>
          <p className="mt-2 text-[11px] text-muted">Falta R$ 90 para bater a meta</p>
        </div>
      </FloatCard>
    </div>
  );
}
