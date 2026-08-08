import { MimuMark } from "../components/Logo";

/**
 * Visual do hero portado de site-v2 (mockup de iPhone + avatares flutuantes
 * + cards de transações/gastos), com `data-parallax`/`data-float` lidos
 * pelo hook `useParallaxFloat` (ver src/hooks/useParallaxFloat.ts — mesmo
 * algoritmo do site-v2, só que como import real).
 *
 * Única peça recriada: a tela dentro do celular. No site-v2 ela é uma
 * imagem rasterizada com o mascote e o texto "Converse com o Pierre"
 * desenhados no próprio arquivo — não dá pra só trocar o nome numa imagem.
 * Reconstruída aqui usando o texto real do chat da Mimu em produção
 * (app/(dashboard)/mimu/page.tsx: "Fala comigo!", sugestões, placeholder).
 * Avatares, cards de transação e card de gastos são os mesmos arquivos do
 * site-v2 (nenhum tem marca do Pierre).
 */

const AVATARES = [
  {
    nome: "Marie",
    img: "/img/v2/avatar-marie.webp",
    className: "left-[-8%] top-[12%] sm:left-[-14%]",
    parallaxStrength: 60,
    parallaxPattern: 2,
    floatStrength: 100,
    floatPattern: 1,
  },
  {
    nome: "Eistein",
    img: "/img/v2/avatar-eistein.webp",
    className: "right-[-6%] top-[30%] sm:right-[-12%]",
    parallaxStrength: 100,
    parallaxPattern: 1,
    floatStrength: 100,
    floatPattern: 2,
  },
  {
    nome: "Galileu",
    img: "/img/v2/avatar-galileu.webp",
    className: "left-[-2%] top-[52%] sm:left-[-8%]",
    parallaxStrength: 100,
    parallaxPattern: 2,
    floatStrength: 100,
    floatPattern: 3,
  },
] as const;

const TRANSACOES = [
  {
    logo: "/img/v2/logo-ifood.webp",
    titulo: "Delivery de comida",
    sub: "Alimentação · 28 de Jun",
    valor: "R$ 42,00",
  },
  {
    logo: "/img/v2/logo-airbnb.webp",
    titulo: "Hospedagem",
    sub: "Viagens · 24 de Jun",
    valor: "R$ 120,00",
  },
] as const;

function AvatarBubble({
  nome,
  img,
  className,
  parallaxStrength,
  parallaxPattern,
  floatStrength,
  floatPattern,
}: (typeof AVATARES)[number]) {
  return (
    <div
      className={`absolute z-10 hidden flex-col items-center gap-1.5 sm:flex ${className}`}
      data-parallax=""
      data-parallax-strength={parallaxStrength}
      data-parallax-pattern={parallaxPattern}
      data-float=""
      data-float-strength={floatStrength}
      data-float-pattern={floatPattern}
    >
      <img
        src={img}
        alt=""
        width={54}
        height={54}
        className="size-[54px] rounded-full object-cover shadow-[0_4px_16px_rgba(30,30,46,0.15)]"
      />
      <div className="rounded-[10px_18px_18px] border border-coral-border bg-coral px-3 py-1.5 text-sm text-cream shadow-sm">
        {nome}
      </div>
    </div>
  );
}

function TelaDoCelular() {
  return (
    <div className="absolute inset-[3%] flex flex-col overflow-hidden rounded-[36px] bg-ink">
      <div className="flex items-center justify-between px-5 pt-6">
        <span className="flex size-9 items-center justify-center rounded-full bg-white/10 text-white">
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M0 1h16M0 6h16M0 11h16" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-coral">
          <MimuMark className="size-4 text-white" />
        </span>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
        <span className="mb-2 flex size-12 items-center justify-center rounded-2xl bg-coral">
          <MimuMark className="size-6 text-white" />
        </span>
        <p className="font-display text-base font-bold text-white">Fala comigo!</p>
        <p className="text-sm text-white/60">
          Pergunta sobre seu caixa, agenda ou clientes que eu te ajudo.
        </p>
      </div>

      <div className="flex gap-2 overflow-hidden px-5 pb-3">
        <span className="flex-shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80">
          Como está meu caixa?
        </span>
        <span className="flex-shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/80">
          Tenho agendamentos hoje?
        </span>
      </div>

      <div className="mx-5 mb-6 rounded-full border border-white/15 bg-white/5 px-4 py-3 text-sm text-white/50">
        Fala com a Mimu...
      </div>
    </div>
  );
}

export function HeroVisualV2() {
  return (
    <div
      className="relative mx-auto mt-8 aspect-[400/824] w-full max-w-[280px] sm:mt-16 sm:max-w-[340px] lg:max-w-[400px]"
      data-parallax
      data-parallax-strength={30}
      data-parallax-pattern={2}
    >
      {/* Corpo titânio do iPhone — mesma técnica CSS usada no mockup real
          do app (app/(marketing)/HeroSection.tsx na main), reaproveitada
          aqui pra ter um celular de verdade em vez da imagem do Pierre. */}
      <div
        className="absolute inset-0 rounded-[52px]"
        style={{
          background:
            "linear-gradient(155deg, #4a4a4a 0%, #232323 18%, #1a1a1a 50%, #2c2c2c 82%, #4a4a4a 100%)",
          boxShadow: "0 50px 90px rgba(30,30,46,0.28), 0 0 0 1px rgba(255,255,255,0.08) inset",
        }}
      />
      <TelaDoCelular />
      <div className="absolute left-1/2 top-[3.5%] z-10 h-[3.5%] w-[28%] -translate-x-1/2 rounded-full bg-black" />

      {AVATARES.map((avatar) => (
        <AvatarBubble key={avatar.nome} {...avatar} />
      ))}

      <div
        className="absolute -bottom-[8%] left-0 z-10 hidden w-[62%] flex-col gap-2.5 rounded-[24px] border border-borda bg-white p-4 shadow-[0_4px_20px_rgba(30,30,46,0.07)] sm:flex sm:-left-[10%] lg:left-[-16%] lg:w-[54%]"
        data-parallax=""
        data-parallax-strength={100}
        data-parallax-pattern={1}
      >
        {TRANSACOES.map((t) => (
          <div key={t.titulo} className="flex items-center gap-3">
            <img src={t.logo} alt="" width={42} height={42} className="size-[42px] flex-shrink-0 rounded-full border border-borda object-cover" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-ink">{t.titulo}</p>
              <p className="truncate text-[11px] text-ink/60">{t.sub}</p>
            </div>
            <p className="flex-shrink-0 text-[12px] text-ink">{t.valor}</p>
          </div>
        ))}
      </div>

      <div
        className="absolute top-[1%] right-0 z-10 hidden w-[58%] overflow-hidden rounded-[24px] border border-borda bg-white p-2 shadow-[0_4px_20px_rgba(30,30,46,0.07)] sm:block sm:-right-[6%] lg:right-[-14%] lg:w-[52%]"
        data-parallax=""
        data-parallax-strength={100}
        data-parallax-pattern={2}
      >
        <img src="/img/v2/hero-graphic-gastos.webp" alt="Gastos essa semana: R$ 1.200,00, alta de 60%" className="w-full" />
      </div>
    </div>
  );
}
