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

export function BottomNav({
  admin = false,
  modulosIniciais,
}: {
  admin?: boolean;
  /**
   * Módulos vindos do servidor, que já tinha a empresa em mãos.
   *
   * Sem isto a barra nascia com a lista vazia e só se completava depois que o
   * AuthProvider terminava de buscar a empresa no navegador — era o "só
   * aparece na segunda visita".
   */
  modulosIniciais?: string[];
}) {
  const pathname = usePathname();
  const { empresa } = useAuth();
  const { alertas } = useAlertasProativos();
  const [menuAberto, setMenuAberto] = useState(false);

  // O do cliente só entra quando existir: ele é a fonte para mudanças feitas
  // durante a sessão (ligar um módulo em Minha Empresa reflete na hora), mas
  // o do servidor é quem faz a primeira pintura já estar certa.
  const { barra, menu, temMais } = dividirNavegacao(
    empresa?.modulos_ativos ?? modulosIniciais ?? [],
  );

  /**
   * Indicador que desliza entre as abas, como nas barras novas do Android.
   *
   * A posição é MEDIDA do item ativo, não calculada por índice: a barra tem
   * um número variável de abas (depende dos módulos ligados) e o botão "Mais"
   * às vezes existe, às vezes não. Dividir a largura por uma contagem daria
   * errado justamente nas contas que mudam.
   */
  /**
   * Compacta ao rolar para baixo, volta ao subir.
   *
   * É o gesto das barras do Instagram e do WhatsApp: enquanto a pessoa
   * desce a lista, a barra recolhe e devolve altura para o conteúdo; ao
   * subir, ela reaparece inteira. O limiar de 8px evita que o tranco de um
   * toque faça a barra piscar.
   */
  const [compacta, setCompacta] = useState(false);

  useEffect(() => {
    let anterior = window.scrollY;

    const aoRolar = () => {
      const atual = window.scrollY;
      const desceu = atual > anterior;
      if (Math.abs(atual - anterior) > 8) {
        // Perto do topo ela nunca fica compacta: ali não há o que ganhar em
        // espaço, e a barra menor pareceria um defeito.
        setCompacta(desceu && atual > 90);
        anterior = atual;
      }
    };

    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

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
      // A largura vem do próprio item, com uma folga de 8px de cada lado: a
      // pílula precisa envolver o ícone E o rótulo, e o rótulo é mais largo
      // que o ícone. Uma largura fixa cobriria só o desenho.
      setIndicador({ x: a.left - n.left + a.width / 2, w: Math.max(a.width - 8, 48) });
    };

    medir();
    // Reagir ao giro da tela e à mudança de largura: sem isso o indicador
    // ficaria parado onde a aba estava antes do redimensionamento.
    const obs = new ResizeObserver(medir);
    obs.observe(nav);
    return () => obs.disconnect();
  }, [pathname, barra.length, temMais, compacta]);

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
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 20px)" }}
      >
        <nav
          ref={navRef}
          className={cn(
            "relative mx-auto flex max-w-[430px] items-stretch justify-around",
            // A altura é a única coisa que muda entre inteira e compacta, e a
            // transição fica no elemento, não numa classe condicional: assim
            // ela vale nos dois sentidos, encolhendo e voltando.
            "transition-[height] duration-300 ease-out motion-reduce:transition-none",
            compacta ? "h-[60px]" : "h-[80px]",
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
              className="pointer-events-none absolute inset-y-2 rounded-[20px] bg-primary-light transition-[transform,width] duration-300 ease-out motion-reduce:transition-none"
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
