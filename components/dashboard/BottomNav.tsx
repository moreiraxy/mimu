"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { dividirNavegacao } from "@/components/dashboard/navItems";
import { MenuLateral } from "@/components/dashboard/MenuLateral";
import { useAuth } from "@/hooks/useAuth";
import { useAlertasProativos } from "@/hooks/useAlertasProativos";
import { cn } from "@/lib/utils";

export function BottomNav({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  const { empresa } = useAuth();
  const { alertas } = useAlertasProativos();
  const [menuAberto, setMenuAberto] = useState(false);

  const { barra, menu, temMais } = dividirNavegacao(empresa?.modulos_ativos ?? []);

  /**
   * Indicador que desliza entre as abas, como nas barras novas do Android.
   *
   * A posição é MEDIDA do item ativo, não calculada por índice: a barra tem
   * um número variável de abas (depende dos módulos ligados) e o botão "Mais"
   * às vezes existe, às vezes não. Dividir a largura por uma contagem daria
   * errado justamente nas contas que mudam.
   */
  const navRef = useRef<HTMLElement>(null);
  const [indicador, setIndicador] = useState<{ x: number; w: number } | null>(
    null,
  );

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const medir = () => {
      const alvo = nav.querySelector<HTMLElement>("[data-ativo='true']");
      if (!alvo) return setIndicador(null);
      const n = nav.getBoundingClientRect();
      const a = alvo.getBoundingClientRect();
      setIndicador({ x: a.left - n.left + a.width / 2, w: 56 });
    };

    medir();
    // Reagir ao giro da tela e à mudança de largura: sem isso o indicador
    // ficaria parado onde a aba estava antes do redimensionamento.
    const obs = new ResizeObserver(medir);
    obs.observe(nav);
    return () => obs.disconnect();
  }, [pathname, barra.length, temMais]);

  // O "Mais" só aparece quando há algo a mais pra mostrar — a não ser que seja
  // a única porta de entrada do painel admin, já que a sidebar é `md:` pra cima
  // e no celular não existiria outro caminho.
  const mostrarMais = temMais || admin;

  // Fica aceso quando a página atual mora dentro do menu: sem isso, ao abrir
  // /produtos a barra inteira apaga e some a noção de onde você está.
  const atualEstaNoMenu =
    !barra.some((item) => item.href === pathname) &&
    (menu.some((item) => item.href === pathname) || pathname === "/admin");

  return (
    <>
      {/* Barra flutuante: descolada das bordas, cantos arredondados e sombra,
          em vez de colada no fim da tela. Fica sobre o conteúdo com fundo
          translúcido e desfoque, então o que está atrás continua sendo
          percebido enquanto rola. A margem de baixo soma o safe-area do
          iPhone, senão a barra encosta no indicador de gestos. */}
      <div
        className="fixed inset-x-0 z-40 px-3 md:hidden"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <nav
          ref={navRef}
          className={cn(
            "relative mx-auto flex h-[72px] max-w-[430px] items-stretch justify-around",
            "rounded-[28px] border border-neutro-border shadow-[0_10px_36px_-10px_rgba(0,0,0,0.4)]",
            // Sem o fallback opaco, num navegador sem backdrop-filter a barra
            // fica quase transparente e o texto de trás atravessa ela.
            "bg-superficie/90",
            "supports-[backdrop-filter]:bg-superficie/60 supports-[backdrop-filter]:backdrop-blur-2xl",
          )}
        >
          {/* A pílula fica ATRÁS dos itens (-z-0 com os links em relative), e
              é ela que se move — não os ícones. Mover o conteúdo faria o
              rótulo tremer durante a transição. */}
          {indicador && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-2.5 h-9 rounded-full bg-primary-light transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none"
              style={{
                width: indicador.w,
                transform: `translateX(${indicador.x - indicador.w / 2}px)`,
                left: 0,
              }}
            />
          )}
          {barra.map(({ href, label, Icon }) => {
            const ativo = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                data-ativo={ativo}
                className="relative flex flex-1 flex-col items-center justify-center gap-1"
              >
                <span className="relative">
                  <Icon size={22} className={ativo ? "text-primary-forte" : "text-neutro-icon"} />
                  {href === "/mimu" && alertas.length > 0 && (
                    <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-erro px-1 text-[9px] font-bold leading-none text-white">
                      {alertas.length > 9 ? "9+" : alertas.length}
                    </span>
                  )}
                </span>
                {/* O rótulo agora aparece sempre, e não só no item ativo:
                    ícone sozinho obriga a adivinhar, e a altura da barra
                    parava de mudar conforme a aba. */}
                <span
                  className={cn(
                    "text-[10px] font-semibold leading-none",
                    ativo ? "text-primary-forte" : "text-neutro-muted",
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}

          {mostrarMais && (
            <button
              type="button"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              aria-haspopup="dialog"
              aria-expanded={menuAberto}
              data-ativo={atualEstaNoMenu}
              className="relative flex flex-1 flex-col items-center justify-center gap-1"
            >
              <MoreHorizontal
                size={22}
                className={atualEstaNoMenu ? "text-primary-forte" : "text-neutro-icon"}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none",
                  atualEstaNoMenu ? "text-primary-forte" : "text-neutro-muted",
                )}
              >
                Mais
              </span>
            </button>
          )}
        </nav>
      </div>

      <MenuLateral
        aberto={menuAberto}
        aoFechar={() => setMenuAberto(false)}
        itens={menu}
        admin={admin}
        alertas={alertas.length}
      />
    </>
  );
}
