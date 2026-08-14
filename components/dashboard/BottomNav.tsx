"use client";

import { useState } from "react";
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
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutro-border bg-superficie [padding-bottom:env(safe-area-inset-bottom)] md:hidden">
        <nav className="mx-auto flex h-16 max-w-[430px] items-stretch justify-around">
          {barra.map(({ href, label, Icon }) => {
            const ativo = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={ativo ? "page" : undefined}
                className="flex flex-1 flex-col items-center justify-center gap-0.5"
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
              className="flex flex-1 flex-col items-center justify-center gap-0.5"
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
