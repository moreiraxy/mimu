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
    className: "left-[-8%] top-[2%] sm:left-[-14%]",
    parallaxStrength: 30,
    floatSeconds: 3,
  },
  {
    iniciais: "CA",
    nome: "Carol",
    cor: "bg-verde",
    className: "right-[-6%] top-[6%] sm:right-[-12%]",
    parallaxStrength: 28,
    floatSeconds: 4,
  },
  {
    iniciais: "MG",
    nome: "Maria",
    cor: "bg-ambar",
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
      className={`absolute z-10 hidden sm:block ${className}`}
      data-parallax=""
      data-parallax-strength={parallaxStrength}
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
  className,
  parallaxStrength,
  floatSeconds,
}: (typeof AVATARES)[number]) {
  return (
    <div
      className={`absolute z-10 hidden flex-col items-center gap-1.5 sm:flex ${className}`}
      data-parallax=""
      data-parallax-strength={parallaxStrength}
    >
      <div
        className="animate-hero-float flex flex-col items-center gap-1.5"
        style={{ animationDuration: `${floatSeconds}s` }}
      >
        <span
          className={`flex size-[54px] items-center justify-center rounded-full text-[15px] font-extrabold text-white shadow-[0_4px_16px_rgba(30,30,46,0.15)] ${cor}`}
        >
          {iniciais}
        </span>
        <div className="rounded-[10px_18px_18px] border border-borda bg-white px-3 py-1.5 text-sm font-semibold text-ink shadow-sm">
          {nome}
        </div>
      </div>
    </div>
  );
}

/** Tela do celular — o dashboard oficial da Mimu (app/(marketing)/HeroSection.tsx), com os tokens de cor traduzidos pro tema do site-mimo. */
function TelaDoCelular() {
  return (
    <div className="absolute inset-[3%] overflow-hidden rounded-[36px] bg-cream">
      {/* barra de status: altura fixa em % da tela, não em flex-grow — o
          bloco de conteúdo abaixo ancora nela com `top`/`bottom` (mesma
          técnica do celular real em app/(marketing)/HeroSection.tsx). Um
          `flex-1` dentro de um `flex-col` cujo próprio pai também depende
          de altura percentual encadeada (aspect-ratio → h-full → h-full)
          não resolve de forma confiável em todo navegador; ancorar por
          `inset` dá altura definida sem depender dessa cadeia. */}
      <div className="absolute inset-x-0 top-0 flex h-[8%] items-center justify-between px-5">
        <p className="text-[11px] font-bold text-ink">9:41</p>
        <div className="flex items-center gap-[4px]">
          <svg width="13" height="10" viewBox="0 0 16 12" fill="none">
            <path d="M1 4.5 Q8 -1 15 4.5" stroke="#1E1E2E" strokeWidth={1.4} fill="none" strokeLinecap="round" />
            <path d="M4 7 Q8 3.5 12 7" stroke="#1E1E2E" strokeWidth={1.4} fill="none" strokeLinecap="round" />
            <circle cx="8" cy="9.5" r="1.1" fill="#1E1E2E" />
          </svg>
          <div className="box-border h-[9px] w-[19px] rounded-[2px] border border-ink p-[1px]">
            <div className="h-full w-3/4 rounded-[1px] bg-ink" />
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 top-[8%] flex flex-col gap-2.5 px-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted">Bom dia,</p>
            <p className="text-[13px] font-extrabold text-ink">Andréia</p>
          </div>
          <span className="flex size-[26px] items-center justify-center rounded-[9px] bg-coral">
            <MimuMark className="size-3 text-white" />
          </span>
        </div>

        <div className="rounded-2xl bg-coral p-3">
          <p className="mb-0.5 text-[9px] text-white/80">Ótimo dia!</p>
          <p className="mb-2.5 text-[11px] text-white">82% da meta de hoje.</p>
          <div className="mb-2 flex justify-between">
            <div>
              <p className="text-[8px] text-white/70">Realizado</p>
              <p className="text-[13px] font-extrabold text-white">R$ 410</p>
            </div>
            <div>
              <p className="text-[8px] text-white/70">Meta</p>
              <p className="text-[13px] font-extrabold text-white">R$ 500</p>
            </div>
          </div>
          <div className="h-[4px] w-full rounded-md bg-white/25">
            <div className="h-full w-[82%] rounded-md bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-borda bg-superficie p-2.5">
            <p className="mb-0.5 text-[9px] text-muted">A receber</p>
            <p className="text-[12px] font-extrabold text-verde">R$ 240</p>
          </div>
          <div className="rounded-xl border border-borda bg-superficie p-2.5">
            <p className="mb-0.5 text-[9px] text-muted">A pagar</p>
            <p className="text-[12px] font-extrabold text-ambar">R$ 180</p>
          </div>
        </div>

        <div className="rounded-xl border border-borda bg-superficie p-2.5">
          <p className="mb-1.5 text-[10px] font-bold text-ink">Agenda de hoje</p>
          <div className="mb-1 flex justify-between">
            <p className="text-[9px] text-ink">Maria · Escova</p>
            <p className="text-[9px] text-muted">14h</p>
          </div>
          <div className="flex justify-between">
            <p className="text-[9px] text-ink">Carol · Manicure</p>
            <p className="text-[9px] text-muted">16h</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Corpo do celular — mesma técnica CSS de app/(marketing)/HeroSection.tsx: gradiente titânio, botões laterais, Dynamic Island, barra de status. */
function Celular() {
  const tiltRef = useScrollTilt<HTMLDivElement>();

  return (
    <div
      className="relative mx-auto aspect-[400/824] w-full max-w-[280px] sm:max-w-[340px] lg:max-w-[400px]"
      data-parallax=""
      data-parallax-strength={12}
      style={{ perspective: 1000 }}
    >
      {/* nó 1: flutuação (CSS `animation`, translateY) */}
      <div className="animate-hero-float relative h-full w-full" style={{ animationDuration: "4s" }}>
        {/* nó 2: tilt 3D no scroll (`useScrollTilt` escreve rotateX/rotateY
            aqui via JS) — precisa ser outro nó, senão a `animation` do pai
            e o `style.transform` imperativo do tilt brigam pela mesma
            propriedade no mesmo elemento. */}
        <div ref={tiltRef} className="relative h-full w-full">
          {/* corpo titânio */}
          <div
            className="absolute inset-0 rounded-[52px]"
            style={{
              background:
                "linear-gradient(155deg, #4a4a4a 0%, #232323 18%, #1a1a1a 50%, #2c2c2c 82%, #4a4a4a 100%)",
              boxShadow: "0 50px 90px rgba(30,30,46,0.28), 0 0 0 1px rgba(255,255,255,0.08) inset",
            }}
          />

          {/* botões laterais */}
          <div className="absolute -left-[2px] top-[20%] h-[4.5%] w-[2px] rounded-l-sm bg-[#232323]" />
          <div className="absolute -left-[2px] top-[28%] h-[9%] w-[2px] rounded-l-sm bg-[#232323]" />
          <div className="absolute -right-[2px] top-[26%] h-[12%] w-[2px] rounded-r-sm bg-[#232323]" />

          <TelaDoCelular />

          {/* Dynamic Island */}
          <div className="absolute left-1/2 top-[3.5%] z-10 flex h-[3.5%] w-[28%] -translate-x-1/2 items-center justify-end rounded-full bg-black pr-[6%]">
            <div className="h-[22%] w-[8%] rounded-full bg-[#1a1a2e]" />
          </div>

          {/* reflexo na borda superior */}
          <div className="absolute left-[14%] right-[14%] top-[2px] h-px rounded-sm bg-white/35" />
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
          um com a própria sombra — não agrupados num card só. */}
      <p className="absolute left-0 top-[20%] z-10 hidden w-[150px] text-[10px] font-bold uppercase tracking-[0.08em] text-muted sm:left-[-240px] sm:block">
        A Mimu te alerta
      </p>

      <FloatCard
        className="left-0 top-[27%] sm:left-[-240px]"
        parallaxStrength={25}
        floatSeconds={3}
      >
        <div className="flex w-[210px] items-start gap-2.5 rounded-[18px] border border-borda bg-white p-3.5 shadow-[0_4px_20px_rgba(30,30,46,0.07)]">
          <span className="flex size-[26px] flex-shrink-0 items-center justify-center rounded-full bg-verde">
            <CheckIcon className="text-white" />
          </span>
          <p className="text-[13px] leading-snug text-ink">
            Parabéns! Você bateu seu recorde de <strong className="font-extrabold">R$ 580</strong>
          </p>
        </div>
      </FloatCard>

      <FloatCard
        className="left-0 top-[46%] sm:left-[-225px]"
        parallaxStrength={20}
        floatSeconds={3.5}
      >
        <div className="flex w-[196px] items-start gap-2.5 rounded-[18px] border border-borda bg-white p-3.5 shadow-[0_4px_20px_rgba(30,30,46,0.07)]">
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
        className="right-0 top-[23%] sm:right-[-260px]"
        parallaxStrength={18}
        floatSeconds={4.5}
      >
        <div className="w-[232px] rounded-[20px] border border-borda bg-white p-4 shadow-[0_4px_20px_rgba(30,30,46,0.07)]">
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
        className="bottom-[3%] right-0 sm:right-[-225px]"
        parallaxStrength={22}
        floatSeconds={5}
      >
        <div className="w-[196px] rounded-[20px] border border-borda bg-white p-4 shadow-[0_4px_20px_rgba(30,30,46,0.07)]">
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
