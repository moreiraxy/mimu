"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, Minus, Plus, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlusIcon } from "@/components/icons/NavIcons";

const ACOES = [
  { label: "Nova venda", icone: Plus, href: "/financeiro/nova-entrada" },
  { label: "Nova despesa", icone: Minus, href: "/financeiro/nova-saida" },
  { label: "Novo agendamento", icone: Calendar, href: "/agenda/novo" },
  { label: "Novo cliente", icone: User, href: "/clientes/novo" },
  { label: "Falar com a Mimu", icone: Sparkles, href: "/mimu" },
] as const;

// Rotas que já SÃO um formulário de criação — mostrar o FAB nelas é
// redundante (a ação "adicionar" já é a tela inteira) e o botão fixo acaba
// sobrepondo o botão de confirmar do formulário, que fica na mesma posição
// de tela conforme o conteúdo rola.
const ROTAS_SEM_FAB = [
  "/financeiro/nova-entrada",
  "/financeiro/nova-saida",
  "/agenda/novo",
  "/clientes/novo",
  "/produtos/novo",
];

export function Fab() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  function selecionar(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (ROTAS_SEM_FAB.includes(pathname)) return null;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-escuro/50 transition-opacity duration-200 lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/*
        `pointer-events-none` aqui (e propagado por herança pros filhos) é
        essencial: esses dois wrappers só existem pra posicionar o botão +
        no canto, mas sem `inset-x-0`/`w-full` + `justify-center`/`items-end`
        eles ocupam a largura inteira da tela — inclusive a altura reservada
        pro menu de ações quando fechado (opacity-0, mas ainda no layout).
        Sem isso, essa faixa larga e "invisível" ficava por cima (z-50, acima
        de tudo) de qualquer coisa embaixo dela nas páginas — no chat da
        Mimu, bem em cima do campo de digitar e do botão de enviar — os
        cliques nunca chegavam lá. Cada elemento que precisa ser clicável de
        verdade (o próprio botão +, e os itens do menu quando aberto)
        reativa com `pointer-events-auto`.
      */}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom)+32px)] z-50 flex justify-center lg:hidden">
        <div className="flex w-full max-w-[430px] flex-col items-end gap-3 px-4">
          <div
            className={cn(
              "flex flex-col items-end gap-2 transition-all duration-200",
              open
                ? "pointer-events-auto translate-y-0 opacity-100"
                : "pointer-events-none translate-y-2 opacity-0",
            )}
          >
            {ACOES.map((acao) => (
              <button
                key={acao.label}
                type="button"
                onClick={() => selecionar(acao.href)}
                className="flex items-center gap-3 rounded-full border border-neutro-border bg-superficie py-2.5 pl-4 pr-2.5 shadow-md"
              >
                <span className="text-sm font-semibold text-escuro">
                  {acao.label}
                </span>
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-primary-forte">
                  <acao.icone className="h-4 w-4" strokeWidth={2.25} />
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? "Fechar" : "Nova ação"}
            className={cn(
              "pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-text shadow-lg transition-transform duration-200",
              open && "rotate-45",
            )}
          >
            <PlusIcon size={26} />
          </button>
        </div>
      </div>
    </>
  );
}
