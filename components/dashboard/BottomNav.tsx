"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItemsVisiveis } from "@/components/dashboard/navItems";
import { useAuth } from "@/hooks/useAuth";
import { useAlertasProativos } from "@/hooks/useAlertasProativos";

export function BottomNav() {
  const pathname = usePathname();
  const { empresa } = useAuth();
  const { alertas } = useAlertasProativos();
  const itens = navItemsVisiveis(empresa?.modulos_ativos ?? []);

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutro-border bg-superficie [padding-bottom:env(safe-area-inset-bottom)] md:hidden">
      <nav className="mx-auto flex h-16 max-w-[430px] items-center justify-around">
        {itens.map(({ href, label, Icon }) => {
          const ativo = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? "page" : undefined}
              className="flex h-full flex-1 flex-col items-center justify-center gap-1"
            >
              <span className="relative">
                <Icon
                  size={22}
                  className={ativo ? "text-coral" : "text-neutro-icon"}
                />
                {href === "/mimu" && alertas.length > 0 && (
                  <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-erro px-1 text-[9px] font-bold leading-none text-white">
                    {alertas.length > 9 ? "9+" : alertas.length}
                  </span>
                )}
              </span>
              {ativo && (
                <span className="text-[11px] font-semibold leading-none text-coral">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
