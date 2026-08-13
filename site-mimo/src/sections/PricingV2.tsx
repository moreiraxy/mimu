import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { AnimatedText } from "../components/AnimatedText";
import { Button } from "../components/Button";
import { Container } from "../components/Container";
import { Parallax } from "../components/Parallax";
import { Revelar } from "../components/Revelar";

/**
 * Portado de site-v2/components/sections/section-07.tsx (#pricing) — mesmo
 * conteúdo e os mesmos 3 planos, mas como React de verdade: um toggle com
 * `useState` em vez de dois grids duplicados no HTML alternando classe
 * `is-active`, e a troca de painel anima com `gsap` importado como módulo
 * (o original chama `gsap.timeline()` como variável global, dependendo de
 * `<Script strategy="beforeInteractive">` que só existe no Next — aqui é
 * `import gsap from "gsap"` de verdade, funciona igual em qualquer bundler).
 *
 * Texto e preços ainda são os do Pierre (conexão de banco) — a pedido
 * explícito, não alterados nesta etapa.
 */

type Periodo = "mensal" | "anual";

const PLANOS = [
  {
    id: "basico",
    nome: "Básico",
    subtitulo: "Pra você começar a organizar suas finanças agora",
    preco: { mensal: "Grátis", anual: "Grátis" },
    sufixo: null,
    features: [
      "Conecte 1 banco",
      "1 agente inteligente",
      "Limite de conversas",
      "Converse no WhatsApp",
    ],
    destaque: false,
    badge: null,
    botaoTexto: "Começar grátis",
    botaoVariant: "outline" as const,
  },
  {
    id: "pro",
    nome: "Pro",
    subtitulo: "Pra quem quer clareza real sobre o próprio dinheiro",
    preco: { mensal: "R$ 39", anual: "R$ 399" },
    sufixo: { mensal: "/mês", anual: "/ano" },
    features: [
      "Conecta até 5 bancos",
      "Conversas ilimitadas",
      "2 agentes inteligentes",
      "Lembretes de pagamentos",
      "Relatórios personalizados",
    ],
    destaque: true,
    badge: "Mais Popular",
    botaoTexto: "Seja Pro",
    botaoVariant: "dark" as const,
  },
  {
    id: "premium",
    nome: "Premium",
    subtitulo: "Pra quem quer o máximo de automação e visão completa do patrimônio",
    preco: { mensal: "R$ 199", anual: "R$ 1.990" },
    sufixo: { mensal: "/mês", anual: "/ano" },
    features: [
      "Até 10 agentes inteligentes",
      "Bancos ilimitados",
      "Acesso prioritário a novidades",
      "Alertas inteligentes avançados",
      "Suporte exclusivo",
    ],
    destaque: false,
    badge: null,
    botaoTexto: "Assinar Premium",
    botaoVariant: "outline" as const,
  },
] as const;

function IconeCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0 text-verde">
      <circle cx="9" cy="9" r="9" fill="currentColor" opacity="0.15" />
      <path d="M5.5 9.2 7.7 11.4 12.5 6.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PricingV2() {
  const [periodo, setPeriodo] = useState<Periodo>("mensal");
  const gridRef = useRef<HTMLDivElement>(null);
  const primeiraRenderizacao = useRef(true);

  // Cross-fade ao trocar de período — mesmo efeito do `tl.to(...opacity...)`
  // do site-v2, só que como import de módulo em vez de `gsap` global.
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false;
      return;
    }
    if (!gridRef.current) return;
    gsap.fromTo(gridRef.current, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" });
  }, [periodo]);

  return (
    <section id="precos" className="bg-bg py-20 md:py-28 lg:py-[120px]">
      <Container className="flex flex-col items-center">
        <AnimatedText
          as="h2"
          text="Escolha seu plano"
          className="text-center font-display text-[32px] font-extrabold tracking-[-0.96px] text-ink md:text-[40px] md:tracking-[-1.2px]"
        />
        <Revelar atraso={140}>
          <p className="mt-3 max-w-[480px] text-center text-base text-muted-strong md:text-lg">
            Comece grátis. Evolua quando quiser. Economize 17% no plano anual.
          </p>
        </Revelar>

        <Revelar atraso={240} className="mt-8 flex gap-1 rounded-full border border-borda bg-superficie p-1">
          {(["mensal", "anual"] as const).map((opcao) => (
            <button
              key={opcao}
              type="button"
              onClick={() => setPeriodo(opcao)}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                periodo === opcao ? "bg-coral text-primary-text" : "text-ink/60 hover:text-ink"
              }`}
            >
              {opcao === "mensal" ? "Mensal" : "Anual"}
              {opcao === "anual" && (
                <span className={periodo === "anual" ? "text-verde" : "text-verde/70"}>-17%</span>
              )}
            </button>
          ))}
        </Revelar>

        <div ref={gridRef} className="mt-10 grid w-full grid-cols-1 items-start gap-5 md:grid-cols-3">
          {PLANOS.map((plano, i) => (
            <Parallax
              key={plano.id}
              // Mesma direção em todos; o card do meio (o destacado) anda
              // mais devagar e fica quase parado enquanto os vizinhos sobem.
              forca={[30, 16, 30][i]}
              padrao={1}
              className="h-full"
            >
            <Revelar atraso={i * 120} className="h-full">
            <div
              className={`flex h-full flex-col rounded-[24px] border p-8 ${
                plano.destaque
                  ? "border-coral bg-superficie shadow-[0_8px_32px_rgba(204,255,0,0.16)]"
                  : "border-borda bg-superficie"
              }`}
            >
              {plano.badge && (
                <span className="mb-4 w-fit rounded-full bg-coral px-3 py-1 text-xs font-bold text-primary-text">
                  {plano.badge}
                </span>
              )}
              <p className="text-sm font-bold text-ink/60">{plano.nome}</p>
              <div className="mt-2 flex items-end gap-1.5">
                <span className="font-display text-[32px] font-extrabold tracking-[-0.96px] text-ink">
                  {plano.preco[periodo]}
                </span>
                {plano.sufixo && (
                  <span className="mb-1 text-sm text-muted">{plano.sufixo[periodo]}</span>
                )}
              </div>
              <p className="mt-3 text-sm leading-[1.4] text-muted-strong">{plano.subtitulo}</p>

              <ul className="mt-6 flex flex-col gap-3">
                {plano.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-ink">
                    <IconeCheck />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                to="/cadastro"
                variant={plano.botaoVariant}
                className="mt-8 w-full justify-center"
              >
                {plano.botaoTexto}
              </Button>
            </div>
            </Revelar>
            </Parallax>
          ))}
        </div>
      </Container>
    </section>
  );
}
