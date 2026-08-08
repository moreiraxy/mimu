import { Fragment } from "react";
import { Link } from "react-router";
import { SectionHeading } from "../components/SectionHeading";
import { useInView } from "../hooks/useInView";

/**
 * Preços.
 *
 * A estrutura do template mudou aqui, e de propósito. Ele vendia TRÊS PACOTES
 * com recursos diferentes (Starter / Professional / Enterprise) e um botão para
 * alternar entre cobrança mensal e anual. A Mimu vende UM produto com QUATRO
 * periodicidades — R$ 39, R$ 99, R$ 179 e R$ 299 —, e todas dão acesso à mesma
 * coisa. Manter o toggle faria o site oferecer uma escolha que não existe, e
 * repetir a lista de recursos em cada card afirmaria uma diferença entre planos
 * que também não existe.
 *
 * Então: quatro cards só de preço, e a lista de recursos uma vez só embaixo.
 *
 * As medidas de caixa continuam as do original (`.framer-9lx4ra` para a seção,
 * `.framer-1b1sl7n` para o card, `.framer-1wrhf3q` para a linha da lista): a
 * grade de 1060px que rola na horizontal abaixo de 1200px é o que impede os
 * cards de se espremerem no tablet.
 */

const BODY =
  "font-display text-[15px] leading-[1.3] font-medium tracking-[-0.02em] md:text-base lg:text-lg";
const CTA =
  "font-display text-[13px] leading-[1.3] font-bold tracking-[-0.02em] md:text-sm lg:text-base";
const AMOUNT =
  "font-display text-[28px] leading-none font-extrabold tracking-[-0.03em] md:text-[27px] lg:text-[39px]";
const PLAN_NAME =
  "font-display text-[16px] leading-[1.3] font-bold tracking-[-0.03em] md:text-[17px] lg:text-[24px]";

/** Reveal vocabulary from the bundles: 500ms tween, cubic-bezier(0.6, 0, 0.4, 1). */
const REVEAL = "500ms cubic-bezier(0.6, 0, 0.4, 1)";

type Plan = {
  /** A periodicidade, que aqui faz o papel de nome do plano. */
  name: string;
  amount: string;
  /** Quanto sai por mês na prática — é a comparação que o cliente faz. */
  perMonth: string;
  note: string;
  /** Só nos planos que economizam; o mensal é a linha de base. */
  economia?: string;
  featured?: boolean;
};

const PLANS: Plan[] = [
  {
    name: "Mensal",
    amount: "R$ 39",
    perMonth: "R$ 39/mês",
    note: "Cobrado todo mês",
  },
  {
    name: "Trimestral",
    amount: "R$ 99",
    perMonth: "R$ 33/mês",
    note: "Cobrado a cada 3 meses",
    economia: "Economize R$ 72/ano",
  },
  {
    name: "Semestral",
    amount: "R$ 179",
    perMonth: "R$ 30/mês",
    note: "Cobrado a cada 6 meses",
    economia: "Economize R$ 110/ano",
  },
  {
    name: "Anual",
    amount: "R$ 299",
    perMonth: "R$ 25/mês",
    note: "Cobrado uma vez por ano",
    economia: "Economize R$ 169/ano",
    featured: true,
  },
];

/** Iguais em todos os planos — por isso aparecem uma vez, não quatro. */
const INCLUSO = [
  "Agenda e clientes ilimitados",
  "Financeiro completo",
  "Faturamento previsto",
  "Assistente Mimu com IA",
  "Produtos e estoque",
  "Controle de fiado",
  "Funciona offline",
  "Suporte por WhatsApp",
];

export function Pricing() {
  return (
    <section
      id="precos"
      className="flex w-full flex-col items-center bg-cream py-10 lg:py-15"
    >
      <div className="container-page flex flex-col items-center gap-10 lg:gap-15">
        <SectionHeading
          eyebrow="Preços"
          heading="Escolha como a Mimu vai cuidar do seu negócio"
          paragraph="7 dias grátis em qualquer plano. Sem cartão de crédito, sem fidelidade."
        />

        {/* Below 1200 the 1060px rail is wider than the container, so the
            original scrolls it horizontally rather than reflowing the cards. */}
        <div className="flex w-full items-start justify-start overflow-x-auto lg:items-center lg:justify-center lg:overflow-visible">
          <div className="w-[920px] shrink-0 md:w-[1060px]">
            <div className="relative flex w-full items-stretch justify-center overflow-clip rounded-2xl border border-borda bg-superficie">
              {PLANS.map((plan, i) => (
                <Fragment key={plan.name}>
                  {i > 0 && <Divider />}
                  <div className="flex-1 basis-0">
                    <PlanCard plan={plan} />
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* A lista única. Todos os planos dão exatamente isto. */}
        <div className="flex w-full max-w-[800px] flex-col items-center gap-6 rounded-2xl border border-borda bg-coral-light px-6 py-8 lg:px-10">
          <p className="font-display text-xs font-bold tracking-[0.1em] text-coral uppercase lg:text-sm">
            Incluso em todos os planos
          </p>

          <ul className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
            {INCLUSO.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <Check />
                <p className={`min-w-0 flex-1 text-ink ${BODY}`}>{item}</p>
              </li>
            ))}
          </ul>

          <p className="text-center text-xs text-muted-strong">
            Sem cartão de crédito para testar. Cancele quando quiser.
          </p>
        </div>
      </div>
    </section>
  );
}

/** 1px column between cards, dashed exactly as the source paints it. */
function Divider() {
  return (
    <div
      aria-hidden="true"
      className="w-px shrink-0 self-stretch border-l border-dashed border-borda"
    />
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const featured = plan.featured;

  // Title first, price row 50ms behind it — the stagger the bundles use.
  const reveal = (delay: number) => ({
    opacity: inView ? 1 : 0,
    transform: inView ? "none" : "translateX(5px)",
    transition: `opacity ${REVEAL} ${delay}ms, transform ${REVEAL} ${delay}ms`,
  });

  return (
    <article
      ref={ref}
      className={`flex h-full w-full flex-col items-start gap-6 p-3 pb-8 ${
        featured ? "bg-coral-light" : "bg-superficie"
      }`}
    >
      <div className="flex w-full flex-1 flex-col items-center gap-5">
        <div
          className={`relative flex w-full flex-1 flex-col items-start justify-between gap-6 overflow-clip rounded-xl p-5 ${
            featured ? "border-[1.5px] border-coral bg-superficie" : "bg-sand"
          }`}
        >
          <div
            className="relative flex w-full flex-col items-start gap-3"
            style={reveal(0)}
          >
            <h3 className={`w-full text-ink ${PLAN_NAME}`}>{plan.name}</h3>

            {featured && (
              <p className="rounded-[1000px] bg-coral px-3 py-1.5 font-display text-[11px] font-bold tracking-[0.06em] text-white uppercase">
                Mais popular
              </p>
            )}
          </div>

          <div
            className="relative flex w-full flex-col items-start gap-1"
            style={reveal(50)}
          >
            <p className={`text-ink ${AMOUNT}`}>{plan.amount}</p>
            <p className="font-display text-sm font-bold text-coral">
              {plan.perMonth}
            </p>
            <p className="font-display text-xs text-muted">{plan.note}</p>
            {/* O verde é reservado a entrada e ganho — que é exatamente o que a
                economia representa aqui. */}
            {plan.economia && (
              <p className="mt-1 rounded-[1000px] bg-verde-light px-2.5 py-1 font-display text-[11px] font-bold text-verde">
                {plan.economia}
              </p>
            )}
          </div>
        </div>

        <Link
          to="/contato"
          className={`relative flex w-full items-center justify-center rounded-[1000px] py-[14px] transition-colors ${CTA} ${
            featured
              ? "bg-coral text-white shadow-lg shadow-coral/25 hover:bg-coral-hover"
              : "border-[1.5px] border-coral text-coral hover:bg-coral hover:text-white"
          }`}
        >
          Começar grátis
        </Link>
      </div>
    </article>
  );
}

/**
 * O selo do template era um pentágono cor de areia com um tique. Aqui ele é o
 * tique da marca sobre o verde de confirmação — a mesma cor que o app usa para
 * dizer "entrou", que é o que cada linha desta lista promete.
 */
function Check() {
  return (
    <span
      aria-hidden="true"
      className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-verde"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 6 9 17l-5-5"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
