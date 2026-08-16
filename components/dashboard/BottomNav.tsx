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
  const [indicador, setIndicador] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const medir = () => {
      // Mede a MOLDURA DO ÍCONE, não o item inteiro. É o formato da barra do
      // WhatsApp: a marca do "você está aqui" é uma pílula deitada atrás do
      // ícone, e o rótulo fica embaixo, fora dela. Envolvendo ícone e rótulo
      // juntos saía um losango alto, que é o que destoava da referência.
      const alvo = nav.querySelector<HTMLElement>("[data-pilula='true']");
      if (!alvo) return setIndicador(null);
      const n = nav.getBoundingClientRect();
      const a = alvo.getBoundingClientRect();
      setIndicador({
        x: a.left - n.left,
        y: a.top - n.top,
        w: a.width,
        h: a.height,
      });
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
            // 64px é a altura da barra do WhatsApp: a pílula de 32 mais o
            // rótulo, com uma folga curta em cima e embaixo. Estava em 80 —
            // a medida do Material Design para uma barra COLADA no fim da
            // tela, que ganha altura porque encosta na borda. Esta aqui
            // flutua, com margem e sombra por fora, e nessa altura sobrava
            // ar dentro dela: lia como uma barra gorda, não como uma barra
            // espaçosa.
            compacta ? "h-[52px]" : "h-[64px]",
            // Cantos totalmente arredondados, como na referência: com raio
            // fixo de 28px numa barra de 80px o canto ficava "quase" redondo,
            // que lê como erro de medida em vez de decisão.
            "rounded-full border border-neutro-border shadow-[0_10px_36px_-10px_rgba(0,0,0,0.45)]",
            // Mais opaca que antes. A referência é quase sólida: translucidez
            // demais deixa o conteúdo passar por trás dos rótulos e atrapalha
            // a leitura justamente do que serve para se localizar.
            "bg-superficie/95",
            "supports-[backdrop-filter]:bg-superficie/80 supports-[backdrop-filter]:backdrop-blur-2xl",
          )}
        >
          {/* A pílula fica ATRÁS dos itens (-z-0 com os links em relative), e
              é ela que se move — não os ícones. Mover o conteúdo faria o
              rótulo tremer durante a transição. */}
          {indicador && (
            <span
              aria-hidden="true"
              // Pílula discreta, e não um bloco colorido: na referência ela
              // só marca onde você está, sem competir com o ícone. O destaque
              // de cor fica no próprio ícone e no rótulo, que já mudam para a
              // cor da marca.
              className="pointer-events-none absolute left-0 top-0 rounded-full bg-primary-light transition-transform duration-300 ease-out motion-reduce:transition-none"
              style={{
                width: indicador.w,
                height: indicador.h,
                transform: `translate(${indicador.x}px, ${indicador.y}px)`,
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
                {/* 64×32 em pixel, e não na escala do app: é a medida exata
                    da pílula da barra do Android, e a raiz daqui é 14px — na
                    escala em rem ela sairia 12% menor que a referência.
                    Existe em todos os itens, ativo ou não, para o ícone não
                    pular de lugar quando a aba muda. */}
                <span
                  data-pilula={ativo}
                  className="relative flex h-[32px] w-[64px] items-center justify-center"
                >
                  <Icon size={24} className={ativo ? "text-primary-forte" : "text-neutro-icon"} />
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
              <span
                data-pilula={atualEstaNoMenu}
                className="flex h-[32px] w-[64px] items-center justify-center"
              >
                <MoreHorizontal
                  size={24}
                  className={atualEstaNoMenu ? "text-primary-forte" : "text-neutro-icon"}
                />
              </span>
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
