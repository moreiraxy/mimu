import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { AnimatedText } from "../components/AnimatedText";
import { Img } from "../components/Img";
import { useInView } from "../hooks/useInView";

/*
 * Every number in this file was read from the original's CSS/JS, never chosen.
 *
 * Type presets used here have FOUR tiers, not three — the >=1440 values are the
 * base rule and 1200-1439 is its own override. That is why `xl:` appears:
 *   heading   (dpkcyd) 39 / 44 / 56 / 64,  lh 1.05em, -0.04/-0.04/-0.03/-0.04em
 *   step head (5rsbti) 22 / 24 / 28 / 32,  lh 1.2em,  -0.03em
 *   body      (z9blpo) 15 / 17 / 19 / 20,  lh 1.3/1.3/1.4/1.3em, -0.03em
 *   numeral   (lrgpxh) 13 / 14 / 15 / 16,  lh 1.3em,  -0.02em
 *   eyebrow   (ckayli) 12 / 13 / 14 / 14,  lh 1.3em,  uppercase
 *
 * Os pesos subiram para o padrão da marca (título 800, corpo 500) — é a única
 * coisa do preset que o brand book contraria.
 *
 * Motion, from the page bundle: every reveal is a 500ms tween on
 * cubic-bezier(.6,0,.4,1); only the delay and the offset differ per element.
 */
const REVEAL_MS = 500;
const EASE = "cubic-bezier(0.6, 0, 0.4, 1)";
/** Tab active/inactive swap is a 400ms tween on the same curve. */
const TAB_MS = 400;

export function HowItWorks() {
  const step2 = useRef<HTMLDivElement>(null);
  const step3 = useRef<HTMLDivElement>(null);
  const active = useActiveStep([step2, step3]);

  return (
    <section
      id="como-funciona"
      className="flex w-full flex-col items-center bg-ink pt-10 pb-20 lg:py-30"
    >
      <div className="container-page flex flex-col items-center gap-15 lg:gap-20">
        {/* Title row: eyebrow takes 1fr, heading+paragraph 4fr, 60px apart.
            Below 744px it collapses to a centred column. */}
        <div className="flex w-full flex-col items-center gap-4 md:flex-row md:items-start md:gap-15">
          <div className="flex w-full flex-col items-center md:w-auto md:flex-[1_0_0] md:items-start md:pt-1">
            <div className="flex w-min items-center gap-2.5">
              <div className="size-2 shrink-0 rounded-[100px] bg-coral" />
              <p className="font-display text-xs leading-[1.3] font-bold tracking-[0.1em] whitespace-pre text-cream uppercase md:text-[13px] lg:text-sm">
                Como funciona
              </p>
            </div>
          </div>

          <div className="flex w-full flex-col items-center gap-4 md:w-auto md:flex-[4_0_0] md:items-start lg:gap-5">
            <AnimatedText
              text="Três passos entre o caderno e o negócio organizado."
              className="w-full max-w-[650px] text-center font-display text-[39px] leading-[1.05] font-extrabold tracking-[-0.04em] text-cream md:w-[90%] md:max-w-[600px] md:text-left md:text-[44px] lg:w-full lg:max-w-[850px] lg:text-[56px] lg:tracking-[-0.03em] xl:text-[64px] xl:tracking-[-0.04em]"
            />
            <Reveal
              delay={200}
              offset="translateY(10px)"
              className="w-4/5 max-w-[550px] md:w-[90%] md:max-w-[650px] lg:w-3/5"
            >
              <p className="text-center font-display text-[15px] leading-[1.4] font-medium tracking-[-0.03em] text-[#f7f6f3d9] md:text-left md:text-[17px] lg:text-[19px] xl:text-xl">
                Do registro da venda ao resumo do dia, a Mimu faz o trabalho
                chato para você cuidar do que realmente importa.
              </p>
            </Reveal>
          </div>
        </div>

        {/* Content row uses the same 1fr / 4fr split as the title row. */}
        <div className="flex w-full items-start gap-15">
          <Tabs active={active} />

          <div className="flex w-full flex-col items-center gap-5 md:w-auto md:flex-[4_0_0] md:gap-10">
            <Step
              number="01"
              title="É só falar. A Mimu anota."
              body="Manda mensagem como manda para uma amiga: “vendi uma escova por 120”. Ela entende, confirma e lança na hora — sem formulário, sem menu, sem cadastro de produto."
              visual={<RegistrarVisual />}
            />
            <Step
              ref={step2}
              id="passo-2"
              number="02"
              title="Tudo se organiza sozinho."
              body="Entradas, contas a pagar, agenda e clientes vão para o lugar certo automaticamente. Nada de planilha travando nem de fórmula quebrada no meio do mês."
              visual={<OrganizarVisual />}
            />
            <Step
              ref={step3}
              id="passo-3"
              number="03"
              title="Você acompanha de onde estiver."
              body="Faturamento do dia, meta, quem ainda te deve e quem vem amanhã, sempre atualizados. Funciona offline e sincroniza sozinho quando a internet volta."
              visual={<AcompanharVisual />}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * The original drives the tab variant off two scroll targets at 50% visibility
 * (step 2 -> tab 2, step 3 -> tab 3, nothing -> tab 1). Taking the last visible
 * target gives the same result and, unlike firing on raw enter/exit events,
 * stays correct when scrolling back up past a step that is still half on screen.
 */
function useActiveStep(refs: RefObject<HTMLDivElement | null>[]) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = refs.map((r) => r.current).filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === "undefined") return;

    const visible = new Set<number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const i = els.indexOf(entry.target as HTMLElement);
          if (entry.intersectionRatio >= 0.5) visible.add(i);
          else visible.delete(i);
        }
        setActive(visible.size ? Math.max(...visible) + 1 : 0);
      },
      { threshold: 0.5 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // Refs are stable for the life of the section.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return active;
}

const TABS = ["Registrar", "Organizar", "Acompanhar"];

/** Sticky at 140px, hidden below 744px. Hairlines above and below every item. */
function Tabs({ active }: { active: number }) {
  return (
    <div className="sticky top-[140px] z-[1] hidden md:block md:flex-[1_0_0]">
      <div className="flex w-full flex-col items-center gap-5">
        <Hairline />
        {TABS.map((label, i) => (
          <div key={label} className="w-full">
            <div
              className="flex w-full items-center transition-opacity"
              style={{
                opacity: i === active ? 1 : 0.5,
                transitionDuration: `${TAB_MS}ms`,
                transitionTimingFunction: EASE,
              }}
            >
              <p className="flex-1 font-display text-[13px] leading-[1.3] font-bold tracking-[0.08em] text-cream uppercase lg:text-sm">
                {label}
              </p>
              {/* O marcador do passo ativo é coral: é o único ponto da seção
                  escura em que a cor da marca aparece, e é ele que diz onde
                  você está. */}
              <div
                className="shrink-0 rounded-[1000px] transition-all"
                style={{
                  width: i === active ? 7 : 5,
                  height: i === active ? 7 : 5,
                  backgroundColor: i === active ? "#ff6b5b" : "#f7f6f3",
                  transitionDuration: `${TAB_MS}ms`,
                  transitionTimingFunction: EASE,
                }}
              />
            </div>
            <Hairline className="mt-5" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Hairline({ className = "" }: { className?: string }) {
  return <div className={`h-px w-full bg-bg/5 ${className}`} />;
}

/**
 * Card shell. Desktop pads 8px on three sides and 36px on the left (24px on
 * tablet); below 744px it stacks and pads a flat 8px.
 */
function Step({
  ref,
  id,
  number,
  title,
  body,
  visual,
}: {
  ref?: RefObject<HTMLDivElement | null>;
  id?: string;
  number: string;
  title: string;
  body: string;
  visual: ReactNode;
}) {
  return (
    <div
      ref={ref}
      id={id}
      className="flex w-full flex-col items-center gap-5 overflow-clip rounded-xl bg-ink-soft p-2 md:flex-row md:gap-6 md:py-2 md:pr-2 md:pl-6 lg:pl-9"
    >
      {/* Fixed 355px on tablet; on desktop it stretches to the visual's height
          and pushes the paragraph to the floor with space-between. */}
      <div className="flex w-full flex-col items-start justify-center gap-3 p-3 md:h-[355px] md:w-auto md:flex-[1_0_0] md:justify-between md:gap-0 md:p-0 md:pb-6 lg:h-auto lg:self-stretch lg:py-6">
        <div className="flex w-full flex-col items-start gap-3 md:py-6 lg:py-0">
          <p className="w-full font-display text-[13px] leading-[1.3] font-extrabold tracking-[-0.02em] text-coral md:text-sm lg:text-[15px] xl:text-base">
            {number}
          </p>
          <h3 className="w-4/5 font-display text-[22px] leading-[1.2] font-extrabold tracking-[-0.03em] text-cream md:w-full md:text-2xl lg:w-4/5 lg:text-[28px] xl:text-[32px]">
            {title}
          </h3>
        </div>
        <p className="w-full font-display text-[15px] leading-[1.4] font-medium tracking-[-0.03em] text-[#f7f6f3d9] opacity-75 md:text-[17px] lg:text-[19px] xl:text-xl">
          {body}
        </p>
      </div>

      {visual}
    </div>
  );
}

/**
 * Shared frame for the three visuals. Portrait 0.885168 on mobile and desktop,
 * but the tablet range switches to its own ratio and caps at 422.5px, growing
 * to 1.2fr so the card stays wide enough for the copy beside it. Step 3's
 * tablet ratio is 0.662577 rather than 0.6625 — a different rule, not a typo,
 * so it is a parameter instead of a second class fighting the first.
 */
function visualClass(mdAspect: string) {
  return `relative flex w-full flex-none flex-col items-center gap-6 overflow-clip rounded-lg aspect-[0.885168] ${mdAspect} md:w-auto md:max-h-[422.5px] md:flex-[1.2_0_0] lg:aspect-[0.885168] lg:max-h-none lg:flex-[1_0_0]`;
}

/** Passo 1: foto de fundo, bandeja desfocada e a pílula abaixo dela. */
function RegistrarVisual() {
  return (
    <div className={`${visualClass("md:aspect-[0.6625]")} justify-center`}>
      <Img
        src="/img/dWMeH45lsShx7VbF7dHcZzP9Z0.jpg"
        alt="Paisagem verde e ensolarada ao fundo do primeiro passo."
        width={801}
        height={535}
        className="absolute inset-0 size-full rounded-lg object-cover"
      />
      <Reveal
        delay={200}
        offset="translateY(20px)"
        className="relative flex aspect-[1.1286] w-[77%] items-center justify-center rounded-xl bg-[#f8f8f64d] p-2.5 backdrop-blur-[3px] md:w-[75%] md:p-1.5"
      >
        <Img
          src="/img/SrZ8SPnJjCeYGtsEDu94wEtJYM.jpg"
          alt="Mensagem registrando uma venda na conversa com a Mimu."
          width={800}
          height={703}
          className="size-full rounded-[10px] object-cover"
        />
      </Reveal>
      <Reveal
        delay={400}
        offset="translateY(20px)"
        className="relative aspect-[7.31034] w-[63%] md:w-[68%]"
      >
        <Img
          src="/img/Y1pg2J8szHjFJCRhUXUyxNteMKA.png"
          alt="Botão para confirmar o lançamento."
          width={876}
          height={120}
          className="absolute inset-0 size-full rounded-[100px] object-cover"
        />
      </Reveal>
    </div>
  );
}

/** Passo 2: sem foto — três cartões fixados por porcentagem sobre um véu claro. */
function OrganizarVisual() {
  return (
    <div className={`${visualClass("md:aspect-[0.6625]")} justify-end bg-bg/5 pb-10`}>
      <FloatingCard
        src="/img/jDf6zlLGU8nRewYuvH69cCzlBU.png"
        alt="Lançamento de uma entrada de R$ 120 organizado pela Mimu."
        width={869}
        height={442}
        delay={100}
        className="aspect-[1.95804] w-[75%] top-[31%] left-[50%] md:w-[79%] md:top-[28%] lg:w-[75%] lg:top-[31%]"
      />
      <FloatingCard
        src="/img/evrFfRLYyzq10b7rptTGco309ns.png"
        alt="Agendamento confirmado para o dia seguinte."
        width={869}
        height={187}
        delay={100}
        className="aspect-[4.62712] w-[70%] top-[60%] left-[69%] md:w-[80%] md:left-[73%] lg:w-[70%] lg:left-[69%]"
      />
      <FloatingCard
        src="/img/tprn5hVvuDUSKG1KpNeGqEgAvU.png"
        alt="Lembrete de uma conta a pagar da semana."
        width={869}
        height={187}
        delay={200}
        className="aspect-[4.62712] w-[75%] top-[80%] left-[50%] md:w-[80%] md:top-[82%] lg:w-[75%] lg:top-[80%]"
      />
    </div>
  );
}

/** These slide in from the right, so the centring translate has to survive it. */
function FloatingCard({
  src,
  alt,
  width,
  height,
  delay,
  className,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  delay: number;
  className: string;
}) {
  return (
    <Reveal
      delay={delay}
      offset="translateX(20px)"
      base="translate(-50%, -50%)"
      className={`absolute z-[1] ${className}`}
    >
      <Img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="absolute inset-0 size-full rounded-md object-cover"
      />
    </Reveal>
  );
}

/** Passo 3: mesma forma do passo 1, mas afastado do topo em vez de centrado. */
function AcompanharVisual() {
  return (
    <div className={`${visualClass("md:aspect-[0.662577]")} justify-center pt-5`}>
      <Img
        src="/img/3s6AschH1QcbwiauUAHiGs4KLYY.jpg"
        alt="Aquarela de colinas verdes ao fundo do terceiro passo."
        width={800}
        height={522}
        className="absolute inset-0 size-full rounded-lg object-cover"
      />
      <Reveal
        delay={100}
        offset="translateY(20px)"
        className="relative flex aspect-[1.16484] w-[77%] items-center justify-center rounded-xl bg-[#f8f8f64d] p-2.5 backdrop-blur-[3px] md:w-[75%] md:p-1.5"
      >
        <Img
          src="/img/vEgCZxqgoAUWDcBcKDRdmoeJvMk.png"
          alt="Painel da Mimu sincronizando os dados do dia."
          width={784}
          height={695}
          className="size-full rounded-[10px] object-cover"
        />
      </Reveal>
      <Reveal
        delay={200}
        offset="translateY(20px)"
        className="relative aspect-[3.63071] w-[73%] md:w-[68%]"
      >
        <Img
          src="/img/9Qdtjx2Net4i7TT3TcJsUxn4rlg.png"
          alt="Ícone da Mimu em destaque na tela inicial do celular."
          width={1151}
          height={306}
          className="absolute inset-0 size-full rounded-md object-cover"
        />
      </Reveal>
    </div>
  );
}

/**
 * Fade + slide on first sight. `base` holds a transform the element needs at
 * rest (the -50%/-50% centring), so the animated offset composes onto it
 * instead of replacing it.
 */
function Reveal({
  delay,
  offset,
  base = "",
  className = "",
  children,
}: {
  delay: number;
  offset: string;
  base?: string;
  className?: string;
  children: ReactNode;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: `${base} ${inView ? "" : offset}`.trim() || "none",
        transition: `opacity ${REVEAL_MS}ms ${EASE} ${delay}ms, transform ${REVEAL_MS}ms ${EASE} ${delay}ms`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
