import { SectionHeading } from "../components/SectionHeading";
import { useInView } from "../hooks/useInView";

/**
 * Bento de 3 cards — geometria e sequência de entrada extraídas do bundle
 * real de eventos.desenrol.ai (componente `sm()`, ver
 * assets/index-BQAh_sVM.js): grid `grid-cols-1 lg:grid-cols-3 gap-2`, cada
 * card `h-130 rounded-3xl overflow-hidden flex flex-col pt-10 px-7`,
 * entrada com IntersectionObserver (`viewport:{once:true,margin:"-80px"}`,
 * `opacity 0→1` + `translateY(50px)→0`, `duration:.7`, `ease:"easeOut"`,
 * atraso escalonado 0.1/0.3/0.5s por card).
 *
 * O conteúdo interno de cada card é nosso: o card 1 usa os mesmos exemplos
 * de conversa do FAQ ("vendi uma escova por 120" — Faqs.tsx), o card 2
 * reusa a agenda real do mockup do hero (Maria·Escova 14h, Carol·Manicure
 * 16h), o card 3 reusa os alertas do hero (recorde de R$580, fiado da
 * Maria). O card em destaque na origem tinha fundo roxo com texto branco;
 * aqui é bg-coral (verde neon), que exige texto preto pro contraste — a
 * mesma regra já aplicada em todo o resto do site.
 */
const EASE = "ease-out";
const DURATION_MS = 700;
/** Leve ultrapassagem — dá o "pop" de mensagem chegando. */
const EASE_POP = "cubic-bezier(0.34, 1.56, 0.64, 1)";

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3a5 5 0 0 0-5 5v3.4c0 .5-.2 1-.5 1.4L5 15h14l-1.5-2.2c-.3-.4-.5-.9-.5-1.4V8a5 5 0 0 0-5-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** Balão de conversa que sobe entrando, com um leve deslocamento lateral. */
function Balao({
  lado,
  atraso,
  children,
}: {
  lado: "esq" | "dir";
  atraso: number;
  children: React.ReactNode;
}) {
  const { ref, inView } = useInView<HTMLDivElement>("-80px");
  const dir = lado === "dir";
  return (
    <div
      ref={ref}
      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-snug ${
        dir ? "ml-auto rounded-tr-sm bg-verde text-white" : "rounded-tl-sm bg-superficie text-ink"
      }`}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translate(0, 0) scale(1)" : `translate(${dir ? 12 : -12}px, 8px) scale(0.94)`,
        transition: `opacity 380ms ${EASE_POP} ${atraso}ms, transform 380ms ${EASE_POP} ${atraso}ms`,
      }}
    >
      {children}
    </div>
  );
}

/** Alerta que entra deslizando de baixo, com o ícone dando um pop depois. */
function Alerta({
  atraso,
  cor,
  icone,
  children,
}: {
  atraso: number;
  cor: string;
  icone: React.ReactNode;
  children: React.ReactNode;
}) {
  const { ref, inView } = useInView<HTMLDivElement>("-80px");
  return (
    <div
      ref={ref}
      className="flex items-center gap-2.5 rounded-2xl bg-superficie px-3.5 py-3 shadow-[0_4px_20px_rgba(30,30,46,0.1)]"
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0) scale(1)" : "translateY(14px) scale(0.96)",
        transition: `opacity 420ms ${EASE_POP} ${atraso}ms, transform 420ms ${EASE_POP} ${atraso}ms`,
      }}
    >
      <span
        className={`flex size-7 shrink-0 items-center justify-center rounded-full text-white ${cor}`}
        style={{
          transform: inView ? "scale(1)" : "scale(0.4)",
          transition: `transform 420ms ${EASE_POP} ${atraso + 140}ms`,
        }}
      >
        {icone}
      </span>
      <p className="text-[12px] leading-snug text-ink">{children}</p>
    </div>
  );
}

function CardShell({
  children,
  bg,
  delayMs,
  forca,
  padrao,
  className = "",
}: {
  children: React.ReactNode;
  bg: string;
  delayMs: number;
  forca: number;
  padrao: 1 | 2;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>("-80px");
  return (
    // O parallax fica no nó de fora porque o de dentro já anima `transform`
    // na entrada — o hook escreve inline e mataria a entrada se dividissem
    // o mesmo elemento.
    <div className="h-[420px] md:h-130">
      <div
        ref={ref}
        className={`group relative flex h-full flex-col overflow-hidden rounded-[24px] px-7 pt-10 ${bg} ${className}`}
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(50px)",
          transition: `opacity ${DURATION_MS}ms ${EASE} ${delayMs}ms, transform ${DURATION_MS}ms ${EASE} ${delayMs}ms`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function FeaturesV2() {
  return (
    <section id="produto" className="bg-bg py-20 md:py-28 lg:py-[120px]">
      <div className="container-page flex flex-col gap-10 lg:gap-15">
        <SectionHeading
          eyebrow="Produto"
          heading={"Tudo o que você precisa.\nNada que você não usa."}
          paragraph="Feito para quem atende o dia inteiro e não tem tempo de aprender sistema."
        />

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
          {/* Card 1 — conversa real, mesmos exemplos do FAQ (Faqs.tsx). */}
          <CardShell bg="bg-ink-soft" delayMs={100} forca={34} padrao={1}>
            <h3 className="max-w-[280px] font-display text-[28px] leading-[1.1] font-medium tracking-[-0.5px] text-cream md:text-[34px]">
              Fala com a Mimu <span className="text-cream/40">pelo WhatsApp</span>
            </h3>
            <p className="mt-3 max-w-[280px] text-sm leading-snug text-cream/60">
              Sem app pra baixar. É o WhatsApp que você já usa, do jeito que você já fala.
            </p>

            {/* As três mensagens entram em sequência, como numa conversa
                chegando de verdade — 3 atrasos de 140ms a partir do card. */}
            <div className="mt-auto mb-7 flex flex-col gap-2">
              <Balao lado="dir" atraso={500}>vendi uma escova por 120</Balao>
              <Balao lado="esq" atraso={780}>Anotado! Já entrou no seu caixa de hoje. 🙌</Balao>
              <Balao lado="dir" atraso={1060}>a Maria vem amanhã às 14h</Balao>
            </div>
          </CardShell>

          {/* Card 2 — mesma agenda do mockup do hero (HeroVisualV2.tsx). */}
          <CardShell bg="bg-ink-soft" delayMs={300} forca={16} padrao={1}>
            <h3 className="max-w-[280px] font-display text-[28px] leading-[1.1] font-medium tracking-[-0.5px] text-cream md:text-[34px]">
              Agenda e clientes, <span className="text-cream/40">sem esquecer</span>
            </h3>
            <p className="mt-3 max-w-[280px] text-sm leading-snug text-cream/60">
              Cada cliente, cada horário, cada fiado — tudo no mesmo lugar, sem caderno.
            </p>

            <div className="mt-auto mb-7 rounded-xl border border-borda bg-superficie p-3.5">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-ink">
                <CalendarIcon className="text-coral transition-transform duration-300 group-hover:scale-125" />
                Agenda de hoje
              </p>
              <div className="mb-1.5 flex justify-between text-[12px]">
                <span className="text-ink">Maria · Escova</span>
                <span className="text-muted">14h</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-ink">Carol · Manicure</span>
                <span className="text-muted">16h</span>
              </div>
            </div>
          </CardShell>

          {/* Card 3 — em destaque (bg-coral), mesmos alertas do hero. */}
          <CardShell bg="bg-coral" delayMs={500} forca={34} padrao={1}>
            <h3 className="max-w-[280px] font-display text-[28px] leading-[1.1] font-medium tracking-[-0.5px] text-primary-text md:text-[34px]">
              Alertas <span className="text-primary-text/50">na hora certa</span>
            </h3>
            <p className="mt-3 max-w-[280px] text-sm leading-snug text-primary-text/70">
              A Mimu avisa antes de você precisar perguntar — recorde do dia, fiado em aberto, o que for.
            </p>

            <div className="mt-auto mb-7 flex flex-col gap-2">
              <Alerta atraso={620} cor="bg-verde" icone={<CheckIcon className="size-3.5" />}>
                Parabéns! Recorde de <strong>R$ 580</strong> hoje.
              </Alerta>
              <Alerta atraso={900} cor="bg-ambar" icone={<BellIcon className="size-3.5" />}>
                Maria ainda te deve <strong>R$ 80</strong>.
              </Alerta>
            </div>
          </CardShell>
        </div>
      </div>
    </section>
  );
}
