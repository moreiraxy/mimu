"use client";

import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAlertasProativos } from "@/hooks/useAlertasProativos";
import { LogoMark } from "@/components/Logo";
import { SignOutButton } from "@/components/SignOutButton";
import { navItemsVisiveis } from "@/components/dashboard/navItems";
import { cn } from "@/lib/utils";

export function Sidebar({ admin = false }: { admin?: boolean }) {
  const pathname = usePathname();
  const { user, empresa } = useAuth();
  const { alertas } = useAlertasProativos();
  const itens = navItemsVisiveis(empresa?.modulos_ativos ?? []);

  const nomeCompleto = user?.user_metadata?.nome_completo as
    | string
    | undefined;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[72px] flex-col border-r border-neutro-border bg-superficie md:flex lg:w-60">
      <div className="flex items-center gap-3 px-3 py-5 lg:px-5">
        <LogoMark size="sm" />
        <p className="hidden text-2xl font-medium tracking-[-0.5px] text-coral lg:block">
          mimu
        </p>
      </div>

      <nav className="mt-2 flex flex-1 flex-col gap-1 px-2 lg:px-3">
        {itens.map(({ href, label, Icon }) => {
          const ativo = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-button px-3 py-2.5 text-sm font-semibold transition-colors",
                "justify-center lg:justify-start",
                ativo
                  ? "bg-coral text-white"
                  : "text-neutro-muted-strong hover:bg-fundo",
              )}
            >
              <span className="relative flex-shrink-0">
                <Icon className="h-5 w-5" />
                {href === "/mimu" && alertas.length > 0 && (
                  <span
                    className={cn(
                      "absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none",
                      ativo ? "bg-superficie text-coral" : "bg-erro text-white",
                    )}
                  >
                    {alertas.length > 9 ? "9+" : alertas.length}
                  </span>
                )}
              </span>
              <span className="hidden lg:inline">{label}</span>
            </Link>
          );
        })}
        {/* Painel admin: fora da lista normal porque não é um módulo do
            negócio — é ferramenta interna do produto. Some pra quem não é
            admin, e mesmo forçado só levaria a um 404 do servidor. */}
        {admin && (
          <Link
            href="/admin"
            aria-current={pathname === "/admin" ? "page" : undefined}
            className={cn(
              "mt-2 flex items-center gap-3 rounded-button border border-dashed border-neutro-border px-3 py-2.5 text-sm font-semibold transition-colors",
              "justify-center lg:justify-start",
              pathname === "/admin"
                ? "bg-coral text-white"
                : "text-neutro-muted-strong hover:bg-fundo",
            )}
          >
            <ShieldCheck className="h-5 w-5 flex-shrink-0" />
            <span className="hidden lg:inline">Painel</span>
          </Link>
        )}
      </nav>

      <div className="border-t border-neutro-border p-3 lg:p-4">
        <div className="hidden lg:block">
          <p className="truncate text-sm font-semibold text-escuro">
            {nomeCompleto ?? "Minha conta"}
          </p>
          <p className="truncate text-xs text-neutro-muted">
            {empresa?.nome ?? "seu negócio"}
          </p>
          <div className="mt-3">
            <SignOutButton />
          </div>
        </div>
        <div className="flex justify-center lg:hidden">
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
