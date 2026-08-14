import { AnimatedText } from "../components/AnimatedText";
import { useInView } from "../hooks/useInView";

/**
 * Porte 1:1 da seção "Quem já investiu com a gente" de desenrol.ai (Fortis
 * 360 Capital) — clones/desenrol-ai-fd5495d6/mirror/desenrol.ai/assets/
 * Scene-D2rXy9GA.js + o CSS das classes .cases-card / .cc-* / .tm-*.
 * Valores copiados literalmente, só cor e conteúdo mudam:
 *
 *   .cases-card  gap .7rem; width clamp(340px,42vw,520px); min-height 340px;
 *                padding clamp(1.4rem,2vw,1.9rem); border-radius 24px;
 *                border 1px rgba(255,255,255,.08);
 *                background: radial-gradient(circle, rgba(255,255,255,.05) 1px,
 *                  transparent 1.5px) 0 0 / 22px 22px,
 *                  radial-gradient(130% 90% at 50% -10%, #1d1d24, #0a0a0e 58%);
 *                box-shadow 0 24px 64px -28px #000000d9;
 *                hover: border-color #ffffff2e; shadow 0 28px 70px -28px #000000e6
 *   .cc-top      flex; justify-between; gap .75rem; margin-bottom .4rem
 *   .cc-avatar   44px círculo, gradiente 135deg, texto .82rem/700 no escuro
 *   .cc-badge    pill .45em .8em; .72rem; letter-spacing .04em; #fff9 sobre #ffffff0f
 *   .cc-label    .82rem; #ffffff80
 *   .cc-title    clamp(1.5rem,2.1vw,2.05rem); line-height 1.08
 *   .cc-quote    .92rem; line-height 1.55; #ffffffb3; itálico
 *   .cc-tag      .72rem; .5em .85em; pill; #ffffffb8 sobre #ffffff0d
 *   .tm-cards    flex col; align center; gap 200px
 *   .tm-row      flex row; justify center; align start; gap clamp(32px,5vw,96px)
 *   .tm-col-offset  padding-top 210px; transform translate(48px)
 *   entrada      {opacity:0,y:40} → {opacity:1,y:0}; duration .6;
 *                ease cubic-bezier(.35,0,0,1); viewport once, amount .2
 *
 * O gradiente dourado do avatar vira o verde neon da Mimu (mesma estrutura
 * escuro→claro→escuro). As falas são as reais dos depoimentos que já estavam
 * no site; o título de cada card é uma frase tirada da própria fala, não um
 * dado novo.
 */

const EASE = "cubic-bezier(0.35, 0, 0, 1)";

const CARD_BG =
  "radial-gradient(circle, rgba(255,255,255,.05) 1px, transparent 1.5px) 0 0 / 22px 22px, radial-gradient(130% 90% at 50% -10%, #1d1d24, #0a0a0e 58%)";

const DEPOIMENTOS = [
  {
    iniciais: "AN",
    nome: "Andréia",
    titulo: "Um resumo todo dia mudou como eu penso o salão.",
    fala: "Antes eu não sabia se estava dando lucro. Hoje a Mimu me manda um resumo todo dia, e isso mudou como eu penso o salão.",
    tags: ["Salão da Andréia", "Caixa diário"],
  },
  {
    iniciais: "MA",
    nome: "Marcos",
    titulo: "O caderno molhado no balcão ficou pra trás.",
    fala: "Eu anotava tudo num caderno que vivia molhado no balcão. Agora falo com a Mimu entre um cliente e outro e pronto, tá lançado.",
    tags: ["Barbearia do Marcos", "WhatsApp"],
  },
  {
    iniciais: "RO",
    nome: "Rodrigo",
    titulo: "Ela lembra quem me deve antes de eu esquecer.",
    fala: "Uso para controlar fiado e estoque no mesmo lugar. A Mimu lembra quem me deve antes de eu esquecer.",
    tags: ["Mercadinho do Rodrigo", "Fiado", "Estoque"],
  },
  {
    iniciais: "CL",
    nome: "Cleide",
    titulo: "Aprendi sozinha no primeiro dia, porque é só conversar.",
    fala: "Minha filha tentou me ensinar planilha três vezes. Com a Mimu eu aprendi sozinha no primeiro dia, porque é só conversar.",
    tags: ["Salão Beleza Pura", "Sem planilha"],
  },
];

export function Testimonials() {
  return (
    <section id="depoimentos" className="w-full overflow-hidden bg-bg py-24 md:py-32">
      <div className="flex w-full flex-col items-center gap-10 px-6">
        <AnimatedText
          as="h2"
          text={"Quem já usa,\nnão volta pro caderno"}
          className="m-0 max-w-[13ch] text-center font-display text-[clamp(2.25rem,8vw,4.5rem)] leading-[0.95] font-bold text-ink"
        />
      </div>

      {/* .tm-cards, gap 200px entre as fileiras */}
      <div className="relative z-[2] mt-16 flex w-full flex-col items-center overflow-visible md:mt-24" style={{ gap: 200 }}>
        {[0, 2].map((inicio) => (
          <div
            key={inicio}
            className="flex w-full flex-col items-center overflow-visible px-6 md:flex-row md:items-start md:justify-center"
            style={{ gap: "clamp(32px, 5vw, 96px)" }}
          >
            <div>
              <Card {...DEPOIMENTOS[inicio]!} numero={inicio + 1} />
            </div>
            {/* Só o degrau vertical (210px), que é o que dá o escalonamento.
                O deslocamento de 48px à direita que vinha do template saiu:
                ele empurrava o par inteiro, deixando as duas colunas 24px
                fora do eixo central da página. */}
            <div className="flex flex-col items-center md:pt-[210px]">
              <div>
                <Card {...DEPOIMENTOS[inicio + 1]!} numero={inicio + 2} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Card({
  iniciais,
  nome,
  titulo,
  fala,
  tags,
  numero,
}: (typeof DEPOIMENTOS)[number] & { numero: number }) {
  const { ref, inView } = useInView<HTMLDivElement>("-20% 0px");

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(40px)",
        transition: `opacity 600ms ${EASE}, transform 600ms ${EASE}`,
      }}
    >
      <div
        className="group relative flex max-w-full flex-col overflow-hidden rounded-[24px] border border-white/8 transition-[border-color,box-shadow] duration-300 hover:border-white/[0.18]"
        style={{
          gap: "0.7rem",
          width: "clamp(340px, 42vw, 520px)",
          minHeight: 340,
          padding: "clamp(1.4rem, 2vw, 1.9rem)",
          background: CARD_BG,
          boxShadow: "0 24px 64px -28px #000000d9",
        }}
      >
        <div className="mb-[0.4rem] flex items-center justify-between gap-3">
          <span
            className="flex size-11 min-w-11 flex-none items-center justify-center rounded-full text-[0.82rem] font-bold tracking-[0.02em] text-[#0a0a0a]"
            style={{ background: "linear-gradient(135deg, #6b8f00 0%, #CCFF00 50%, #4d6600 100%)" }}
          >
            {iniciais}
          </span>
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-[0.8em] py-[0.45em] text-[0.72rem] leading-none tracking-[0.04em] text-white/60">
            Depoimento {String(numero).padStart(2, "0")}
          </span>
        </div>

        <p className="m-0 text-[0.82rem] text-white/50">{nome}</p>

        <p
          className="m-0 font-display leading-[1.08] text-white"
          style={{ fontSize: "clamp(1.5rem, 2.1vw, 2.05rem)" }}
        >
          {titulo}
        </p>

        <p className="m-0 text-[0.92rem] leading-[1.55] text-white/70 italic">{fala}</p>

        <div className="mt-[0.15rem] flex flex-wrap gap-[0.4rem]">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/[0.05] px-[0.85em] py-[0.5em] text-[0.72rem] leading-none whitespace-nowrap text-white/70"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
