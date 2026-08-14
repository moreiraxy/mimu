import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "./Button";
import { Logo } from "./Logo";

const NAV = [
  { label: "Produto", to: "/#produto" },
  { label: "Como funciona", to: "/#como-funciona" },
  { label: "Preços", to: "/#precos" },
  { label: "Histórias", to: "/historias" },
];

/**
 * Past ~3px of scroll the bar collapses from a full-width 1200px row into a
 * pill sized to its own content. Threshold and geometry are measured from the
 * original; the easing approximates its spring (bounce 0.2 over 0.4s).
 *
 * A pílula da Mimu é branca e translúcida com borda, não o bloco sólido do
 * template: é assim que o site atual resolve o header, e sobre o fundo #F7F6F3
 * um preenchimento opaco criaria uma faixa dura no meio da página.
 */
const SCROLL_THRESHOLD = 3;
const MORPH = "400ms cubic-bezier(0.34, 1.26, 0.64, 1)";

/** Tamanho compacto pedido só pro CTA do navbar — o resto do site continua no Button padrão (49px). */
const NAV_CTA_STYLE = {
  height: "40px",
  padding: "0 20px",
  fontSize: "14px",
  flexShrink: 0,
  whiteSpace: "nowrap",
  borderRadius: "100px",
} as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [stuck, setStuck] = useState(false);

  // Lock the page behind the mobile drawer.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-5 z-50 flex flex-col items-center px-6 md:px-10 lg:px-0">
      <div
        className={`flex items-center ${
          stuck
            ? "h-[57px] w-auto gap-11 rounded-[100px] border py-1 pr-1 pl-5 shadow-lg shadow-ink/5"
            : "h-[49px] w-full max-w-[1200px] justify-between rounded-none border-transparent bg-transparent p-0"
        }`}
        style={
          stuck
            ? {
                // Pedido: só adicionar o vidro fosco ao estado que já existia
                // (grudado no topo) — forma, tamanho e o morph continuam os
                // mesmos de antes, só a cor/blur do fundo mudou.
                background: "rgba(10, 10, 10, 0.75)",
                backdropFilter: "blur(20px) saturate(180%)",
                WebkitBackdropFilter: "blur(20px) saturate(180%)",
                borderColor: "rgba(255, 255, 255, 0.06)",
                transition: `width ${MORPH}, height ${MORPH}, background-color ${MORPH}, border-radius ${MORPH}, padding ${MORPH}`,
              }
            : {
                transition: `width ${MORPH}, height ${MORPH}, background-color ${MORPH}, border-radius ${MORPH}, padding ${MORPH}`,
              }
        }
      >
        <Link to="/" aria-label="Mimu, início">
          <Logo tone="dark" />
        </Link>

        <nav className="hidden items-center gap-[18px] lg:flex">
          {NAV.map((item) => (
            <NavLink key={item.label} {...item} />
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button to="/cadastro" style={NAV_CTA_STYLE}>
            Começar grátis
          </Button>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          aria-expanded={open}
          className="flex h-[49px] w-[49px] flex-col items-center justify-center gap-1.25 rounded-full border border-borda/60 bg-bg lg:hidden"
        >
          <span
            className="block h-[1.5px] w-4 rounded-full bg-ink transition-transform duration-300"
            style={
              open ? { transform: "translateY(3.25px) rotate(45deg)" } : undefined
            }
          />
          <span
            className="block h-[1.5px] w-4 rounded-full bg-ink transition-transform duration-300"
            style={
              open
                ? { transform: "translateY(-3.25px) rotate(-45deg)" }
                : undefined
            }
          />
        </button>
      </div>

      {open && (
        <div className="w-full max-w-[1200px] lg:hidden">
          <nav className="mt-3 flex flex-col gap-1 rounded-3xl border border-borda/60 bg-bg p-4 shadow-[0_12px_40px_rgba(30,30,46,0.08)]">
            {NAV.map((item) => (
              <NavLink
                key={item.label}
                {...item}
                className="py-2"
                onClick={() => setOpen(false)}
              />
            ))}
            {/* `flex flex-col` estica os filhos por padrão (`align-items:
                stretch`), os NavLinks acima não mostram isso por não
                terem fundo, mas o Button tem `bg-coral` e ficava esticado
                à largura inteira do menu. `self-center` tira ele dessa
                esticada e deixa do tamanho do conteúdo, como no desktop. */}
            <Button to="/cadastro" className="mt-2 self-center" style={NAV_CTA_STYLE}>
              Começar grátis
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({
  label,
  to,
  className = "",
  onClick,
}: {
  label: string;
  to: string;
  className?: string;
  onClick?: () => void;
}) {
  const cls = `font-display text-base font-bold tracking-[-0.32px] text-muted-strong transition-colors hover:text-ink ${className}`;
  return to.includes("#") ? (
    <a href={to} className={cls} onClick={onClick}>
      {label}
    </a>
  ) : (
    <Link to={to} className={cls} onClick={onClick}>
      {label}
    </Link>
  );
}
