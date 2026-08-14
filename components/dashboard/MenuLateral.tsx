"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck, X } from "lucide-react";
import { useMountedTransition } from "@/hooks/useMountedTransition";
import { cn } from "@/lib/utils";
import type { NAV_ITEMS } from "@/components/dashboard/navItems";

type Item = (typeof NAV_ITEMS)[number];

const DURACAO_SAIDA = 260;

/**
 * Menu do celular, aberto pelo botão "Mais" da barra de baixo.
 *
 * Entra pela direita e sai pela direita — o mesmo caminho nos dois sentidos,
 * pra ficar claro de onde ele veio e pra onde foi. Fecha por toque fora, pelo
 * X e pelo Esc.
 */
export function MenuLateral({
  aberto,
  aoFechar,
  itens,
  admin = false,
  alertas = 0,
}: {
  aberto: boolean;
  aoFechar: () => void;
  itens: readonly Item[];
  admin?: boolean;
  alertas?: number;
}) {
  const pathname = usePathname();
  const { rendered, visible } = useMountedTransition(aberto, DURACAO_SAIDA);
  const painelRef = useRef<HTMLDivElement>(null);

  // Esc fecha, e enquanto o menu está aberto o fundo não rola — sem isso a
  // página atrás desliza junto com o dedo e o menu parece solto.
  useEffect(() => {
    if (!aberto) return;

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);

    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Manda o foco pro painel: quem navega por teclado ou leitor de tela
    // continuaria preso na página de trás.
    painelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAntes;
    };
  }, [aberto, aoFechar]);

  if (!rendered) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={aoFechar}
        className={cn(
          "absolute inset-0 h-full w-full bg-escuro/50 transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={painelRef}
        tabIndex={-1}
        className={cn(
          "absolute inset-y-0 right-0 flex w-[82%] max-w-[320px] flex-col bg-superficie shadow-2xl outline-none",
          "transition-transform duration-260 ease-out motion-reduce:transition-opacity motion-reduce:duration-100",
          visible ? "translate-x-0" : "translate-x-full motion-reduce:translate-x-0",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between border-b border-neutro-border px-5 py-4">
          <span className="text-sm font-bold uppercase tracking-wide text-neutro-muted">
            Menu
          </span>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar menu"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutro-icon transition-colors hover:bg-neutro-border hover:text-escuro"
          >
            <X className="h-5 w-5" strokeWidth={2.25} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {itens.map(({ href, label, Icon }) => {
            const ativo = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={aoFechar}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  // 52px de altura: alvo de toque confortável, bem acima dos
                  // 44px mínimos.
                  "flex h-[52px] items-center gap-3.5 rounded-button px-3 transition-colors",
                  ativo ? "bg-primary-light text-primary-forte" : "text-escuro hover:bg-neutro-border",
                )}
              >
                <Icon size={22} className={ativo ? "text-primary-forte" : "text-neutro-icon"} />
                <span className="flex-1 text-[15px] font-semibold">{label}</span>
                {href === "/mimu" && alertas > 0 && (
                  <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-erro px-1.5 text-[11px] font-bold leading-none text-white">
                    {alertas > 9 ? "9+" : alertas}
                  </span>
                )}
              </Link>
            );
          })}

          {admin && (
            <>
              <div className="my-2 border-t border-neutro-border" />
              <Link
                href="/admin"
                onClick={aoFechar}
                aria-current={pathname === "/admin" ? "page" : undefined}
                className={cn(
                  "flex h-[52px] items-center gap-3.5 rounded-button px-3 transition-colors",
                  pathname === "/admin"
                    ? "bg-primary-light text-primary-forte"
                    : "text-escuro hover:bg-neutro-border",
                )}
              >
                <ShieldCheck
                  size={22}
                  className={pathname === "/admin" ? "text-primary-forte" : "text-neutro-icon"}
                />
                <span className="flex-1 text-[15px] font-semibold">Painel</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </div>
  );
}
