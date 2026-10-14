"use client";

import Link from "next/link";
import { MoreHorizontal, Shield } from "lucide-react";
import { MarcaTraco } from "@/components/Logo";
import { MimuIcon, PlusIcon } from "@/components/icons/NavIcons";
import { cn } from "@/lib/utils";

/**
 * A navegação do computador: uma régua colada à esquerda.
 *
 * POR QUE EXISTE. O app só tinha a pílula flutuante do rodapé, a mesma em
 * qualquer largura. No MacBook dela isso é uma ilha de 430px centralizada num
 * rodapé de 1440px: o resto da largura fica vazio, a mão atravessa a tela para
 * trocar de seção, e os destinos que não couberam nos três lugares da pílula
 * continuavam escondidos atrás do "Mais" numa tela que tem espaço de sobra.
 * O pedido dela foi direto: "o menu pode ser jogado para a lateral".
 *
 * MOSTRA TODOS OS DESTINOS, e é a diferença que justifica a peça: na vertical
 * cabem os oito, então "Mais" deixa de guardar página e passa a guardar só o
 * que é de sistema (admin, sair). Quem usa computador para de precisar lembrar
 * onde um item mora.
 *
 * Só aparece de `md` para cima. Abaixo disso a barra de baixo continua
 * intocada — ela foi desenhada para o polegar, e régua lateral em tela de
 * celular come largura de conteúdo.
 *
 * `w-[72px]` com ícone só; de `lg` em diante abre para 220px e mostra o nome.
 * O layout reserva essa faixa com padding (ver app/(dashboard)/layout.tsx), e
 * não com `margin`, para o papel de parede continuar atravessando por baixo.
 */
export function NavLateral({
  destinos,
  pathname,
  tocado,
  aoTocar,
  alertas,
  admin,
  temAcoes,
  aoAbrirAcoes,
  aoAbrirMenu,
}: {
  destinos: readonly {
    href: string;
    label: string;
    Icon: React.ComponentType<{ size?: number }>;
  }[];
  pathname: string;
  /** O destino tocado antes do endereço mudar — ver `tocado` em BottomNav. */
  tocado: string | null;
  aoTocar: (href: string) => void;
  alertas: number;
  admin: boolean;
  temAcoes: boolean;
  aoAbrirAcoes: () => void;
  /**
   * Abre a folha do menu. É a ÚNICA porta para "Sair" em toda a interface:
   * `SignOutButton` não é usado em lugar nenhum e a tela de Perfil não tem
   * botão de sair — conferido com busca no projeto. Sem isto, esconder a barra
   * de baixo no computador trancaria a pessoa dentro da conta.
   */
  aoAbrirMenu: () => void;
}) {
  function estaAceso(href: string) {
    if (tocado) return tocado === href;
    if (href === "/dashboard") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="vidro-card fixed left-3 top-3 bottom-3 z-40 hidden w-[72px] flex-col gap-1 rounded-[22px] p-2.5 md:flex lg:w-[220px] lg:p-3"
    >
      <Link
        href="/posto"
        className="mb-2 flex h-11 items-center justify-center lg:justify-start lg:px-2"
        aria-label="Mimu"
      >
        <MarcaTraco className="h-6 w-auto text-primary-forte" />
      </Link>

      {/* A Mimu primeiro, e separada: no rodapé ela é o botão da marca no canto
          direito, e aqui o equivalente é o lugar de honra no alto. */}
      <Link
        href="/mimu"
        onClick={() => aoTocar("/mimu")}
        className={cn(
          "relative flex h-11 items-center gap-3 rounded-full px-2.5 text-[14px] font-bold transition",
          estaAceso("/mimu")
            ? "bg-primary/20 text-primary-forte"
            : "text-escuro hover:bg-escuro/[0.05]",
        )}
      >
        <span className="flex w-[42px] shrink-0 items-center justify-center lg:w-auto">
          <MimuIcon size={22} />
        </span>
        <span className="hidden truncate lg:block">Mimu</span>
        {alertas > 0 && (
          <span className="absolute left-7 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-erro px-1 text-[10px] font-bold leading-none text-white lg:static lg:ml-auto">
            {alertas}
          </span>
        )}
      </Link>

      <div className="my-1 h-px bg-neutro-border" />

      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {destinos
          .filter((item) => item.href !== "/mimu")
          .map((item) => {
            const aceso = estaAceso(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => aoTocar(item.href)}
                  aria-current={aceso ? "page" : undefined}
                  className={cn(
                    "flex h-11 items-center gap-3 rounded-full px-2.5 text-[14px] font-semibold transition",
                    aceso
                      ? "bg-primary/20 text-primary-forte"
                      : "text-escuro hover:bg-escuro/[0.05]",
                  )}
                >
                  <span className="flex w-[42px] shrink-0 items-center justify-center lg:w-auto">
                    <item.Icon size={22} />
                  </span>
                  <span className="hidden truncate lg:block">{item.label}</span>
                </Link>
              </li>
            );
          })}

        {admin && (
          <li>
            <Link
              href="/admin"
              onClick={() => aoTocar("/admin")}
              className={cn(
                "flex h-11 items-center gap-3 rounded-full px-2.5 text-[14px] font-semibold transition",
                estaAceso("/admin")
                  ? "bg-primary/20 text-primary-forte"
                  : "text-neutro-muted hover:bg-escuro/[0.05]",
              )}
            >
              <span className="flex w-[42px] shrink-0 items-center justify-center lg:w-auto">
                <Shield size={20} />
              </span>
              <span className="hidden truncate lg:block">Painel</span>
            </Link>
          </li>
        )}
      </ul>

      {/* O "+" fica no PÉ da régua, e não no alto: é ação, não destino, e no
          rodapé do celular ele também vive separado dos destinos. */}
      {temAcoes && (
        <button
          type="button"
          onClick={aoAbrirAcoes}
          className="mt-1 flex h-11 items-center gap-3 rounded-full bg-primary px-2.5 text-[14px] font-bold text-primary-text transition active:scale-[0.97]"
        >
          <span className="flex w-[42px] shrink-0 items-center justify-center lg:w-auto">
            <PlusIcon size={22} />
          </span>
          <span className="hidden truncate lg:block">Novo</span>
        </button>
      )}

      <button
        type="button"
        onClick={aoAbrirMenu}
        className="mt-1 flex h-11 items-center gap-3 rounded-full px-2.5 text-[14px] font-semibold text-neutro-muted transition hover:bg-escuro/[0.05]"
      >
        <span className="flex w-[42px] shrink-0 items-center justify-center lg:w-auto">
          <MoreHorizontal size={22} />
        </span>
        <span className="hidden truncate lg:block">Mais e sair</span>
      </button>
    </nav>
  );
}
