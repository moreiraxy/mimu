import { AnimatedText } from "../components/AnimatedText";
import { Button } from "../components/Button";
import { Container } from "../components/Container";

/**
 * Os 3 blocos alternados de features, portados de site-v2
 * (components/sections/section-04/05/06.tsx) — ilustração editorial +
 * card de dados flutuante (`data-parallax`, lido pelo hook
 * `useParallaxFloat`), alternando lado da imagem.
 *
 * Texto e cards de dados ainda são os do Pierre (bancos conectados,
 * investimentos) — a pedido explícito, não alterados nesta etapa.
 */
const BLOCOS = [
  {
    reverso: true,
    titulo: "Surpresas na fatura?\nNão comigo.",
    texto: "Eu categorizo cada gasto, identifico cobranças estranhas e organizo tudo pra você nunca ser pego de surpresa no fim do mês.",
    imagem: "/img/v2/feature-01-surpris-bill.webp",
    card: "/img/v2/feature-01-card.svg",
    parallaxStrength: 40,
  },
  {
    reverso: false,
    titulo: "Veja pra onde seu\ndinheiro tá indo",
    texto: "Analiso seus gastos automaticamente, encontro padrões e mostro onde dá pra economizar. Sem você precisar abrir planilha nenhuma.",
    imagem: "/img/v2/feature-02-clarify-money.webp",
    card: "/img/v2/feature-02-card.svg",
    parallaxStrength: 40,
  },
  {
    reverso: true,
    titulo: "Seus investimentos,\ndo jeito que deviam ser",
    texto: "Visão clara de tudo que você tem investido, em todos os bancos. Pra entender seu patrimônio hoje e tomar decisões melhores amanhã.",
    imagem: "/img/v2/feature-03-forecast-cost.webp",
    card: "/img/v2/feature-03-card.svg",
    parallaxStrength: 40,
  },
] as const;

function Bloco({ reverso, titulo, texto, imagem, card, parallaxStrength }: (typeof BLOCOS)[number]) {
  return (
    <div className={`flex flex-col items-center gap-10 md:gap-16 lg:gap-20 ${reverso ? "md:flex-row" : "md:flex-row-reverse"}`}>
      <div className="flex w-full flex-col items-start gap-5 md:w-[42%]">
        <AnimatedText
          as="h2"
          text={titulo}
          className="font-display text-[32px] leading-[1.15] font-extrabold tracking-[-0.96px] text-ink md:text-[40px] md:tracking-[-1.2px]"
        />
        <p className="max-w-[440px] text-base leading-[1.4] text-muted-strong md:text-lg">
          {texto}
        </p>
        <Button to="/contato" variant="outline">
          Começar grátis
        </Button>
      </div>

      <div className="relative w-full md:w-[52%]">
        <div className="aspect-square w-full overflow-hidden rounded-[24px]">
          <img src={imagem} alt="" className="size-full object-cover" />
        </div>
        <div
          className="absolute -bottom-6 -right-4 w-[62%] max-w-[320px] overflow-hidden rounded-[20px] border border-borda bg-white shadow-[0_8px_32px_rgba(30,30,46,0.1)] sm:right-[-8%]"
          data-parallax=""
          data-parallax-strength={parallaxStrength}
        >
          <img data-animate-on-view="true" src={card} alt="" className="w-full" />
        </div>
      </div>
    </div>
  );
}

export function FeaturesV2() {
  return (
    <section className="bg-cream py-20 md:py-28 lg:py-[120px]">
      <Container className="flex flex-col gap-24 md:gap-32 lg:gap-40">
        {BLOCOS.map((bloco) => (
          <Bloco key={bloco.titulo} {...bloco} />
        ))}
      </Container>
    </section>
  );
}
