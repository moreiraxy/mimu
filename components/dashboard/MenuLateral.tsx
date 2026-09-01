"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ShieldCheck } from "lucide-react";
import { useMountedTransition } from "@/hooks/useMountedTransition";
import { cn } from "@/lib/utils";
import type { NAV_ITEMS } from "@/components/dashboard/navItems";

type Item = (typeof NAV_ITEMS)[number];

const DURACAO_SAIDA = 240;

/**
 * O menu do botão "Mais" da barra de baixo.
 *
 * ERA UMA GAVETA PRETA de tela cheia entrando pela direita, com uma lista de
 * linhas soltas e um "MENU" miúdo em maiúsculas no alto. Nenhuma dessas coisas
 * existe no resto do app: nem o preto chapado, nem a lista sem cartões, nem a
 * entrada lateral.
 *
 * Agora é uma FOLHA DE VIDRO que sobe de baixo, com cada destino num cartão
 * próprio — o mesmo material e o mesmo formato das opções do perfil, e o mesmo
 * gesto da folha de "Nova ação". E sobe de baixo por um motivo simples: o botão
 * que a abre está na barra de baixo, e o menu aparecendo onde o dedo acabou de
 * tocar poupa a viagem de volta.
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
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <div
        aria-hidden="true"
        onClick={aoFechar}
        className={cn(
          // Escurece mais que o padrão porque os cartões da folha são de VIDRO:
          // eles deixam passar o que está atrás, e sobre um gráfico claro o
          // rótulo da opção começa a competir com a página. O escurecimento é
          // o que devolve a leitura sem tirar a translucidez.
          "absolute inset-0 bg-black/65 transition-opacity duration-200 motion-reduce:transition-none",
          visible ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={painelRef}
        tabIndex={-1}
        className={cn(
          "absolute inset-x-0 bottom-0 outline-none",
          "transition-transform duration-[240ms] ease-out motion-reduce:transition-none",
          visible ? "translate-y-0" : "translate-y-full",
        )}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <div className="mx-auto flex max-w-[430px] flex-col gap-2.5 px-3">
          {/* Puxador: a pista de que a folha se fecha arrastando pra baixo. */}
          <div className="flex justify-center pb-1">
            <span
              aria-hidden="true"
              className="h-1 w-9 rounded-full bg-white/30"
            />
          </div>

          {itens.map(({ href, label, Icon }) => {
            const ativo = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={aoFechar}
                aria-current={ativo ? "page" : undefined}
                className={cn(
                  "vidro flex items-center gap-3 rounded-[18px] px-4 py-[17px]",
                  "transition-transform active:scale-[0.99] motion-reduce:active:scale-100",
                )}
              >
                <Icon
                  size={20}
                  className={ativo ? "text-primary-forte" : "text-neutro-muted"}
                />
                <span
                  className={cn(
                    "flex-1 text-[15px] font-semibold",
                    ativo ? "text-primary-forte" : "text-escuro",
                  )}
                >
                  {label}
                </span>
                {href === "/mimu" && alertas > 0 && (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-erro px-1 text-[10px] font-bold leading-none text-white">
                    {alertas > 9 ? "9+" : alertas}
                  </span>
                )}
                <ChevronRight
                  className="h-[18px] w-[18px] text-neutro-muted"
                  strokeWidth={2}
                />
              </Link>
            );
          })}

          {admin && (
            <Link
              href="/admin"
              onClick={aoFechar}
              aria-current={pathname === "/admin" ? "page" : undefined}
              className="vidro flex items-center gap-3 rounded-[18px] px-4 py-[17px]"
            >
              <ShieldCheck
                size={20}
                className={
                  pathname === "/admin" ? "text-primary-forte" : "text-neutro-muted"
                }
              />
              <span className="flex-1 text-[15px] font-semibold text-escuro">
                Painel
              </span>
              <ChevronRight
                className="h-[18px] w-[18px] text-neutro-muted"
                strokeWidth={2}
              />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
