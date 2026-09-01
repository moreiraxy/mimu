"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * O título de um grupo de opções — "Geral", "Segurança", "Suporte".
 *
 * Fica FORA do cartão, pequeno e apagado, e não dentro dele como cabeçalho.
 * É o que diferencia uma lista de ajustes de uma pilha de cartões: o título
 * solto agrupa sem competir, e o olho pula direto para a opção que procura.
 */
export function TituloGrupo({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="px-1 pb-2 pt-5 text-[13px] font-semibold text-neutro-muted">
      {children}
    </h2>
  );
}

/**
 * Uma opção da lista.
 *
 * A tela de ajustes antiga era uma página só, com nove seções abertas
 * empilhadas: para chegar em "alterar senha" era preciso rolar por meta,
 * módulos, categorias e notificações. Aqui cada função é uma linha que leva à
 * sua própria tela — a lista inteira cabe num olhar, e cada tela tem uma
 * coisa só para decidir.
 *
 * Três destinos possíveis, e é por isso que o elemento muda de tipo:
 *
 *   `href`    tela de dentro do app → <Link>, para o Next pré-carregar e para
 *             o "abrir em nova aba" funcionar
 *   `externo` WhatsApp, App Store → <a> com rel de segurança
 *   `aoTocar` ação aqui mesmo (sair da conta) → <button>
 */
export function Linha({
  icone: Icone,
  label,
  detalhe,
  href,
  externo,
  aoTocar,
  perigo = false,
}: {
  icone: LucideIcon;
  label: string;
  /** O valor atual, à direita — "Escuro", "Ativada". Some quando não há o que dizer. */
  detalhe?: string;
  href?: string;
  externo?: string;
  aoTocar?: () => void;
  /** Vermelho, para o que não se desfaz. */
  perigo?: boolean;
}) {
  const conteudo = (
    <>
      <span
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
          perigo ? "text-erro-texto" : "text-neutro-muted-strong",
        )}
      >
        <Icone className="h-[19px] w-[19px]" strokeWidth={2} />
      </span>
      <span
        className={cn(
          "flex-1 text-[15px] font-semibold",
          perigo ? "text-erro-texto" : "text-escuro",
        )}
      >
        {label}
      </span>
      {detalhe && (
        <span className="truncate text-[13px] text-neutro-muted">{detalhe}</span>
      )}
      {!perigo && (
        <ChevronRight
          className="h-[18px] w-[18px] flex-shrink-0 text-neutro-muted"
          strokeWidth={2}
        />
      )}
    </>
  );

  /*
   * Cada opção é um CARTÃO PRÓPRIO, e não uma linha dentro de um cartão.
   *
   * Estavam agrupadas com divisórias — um bloco só com fios separando as
   * linhas. A referência faz o contrário: cada item é um retângulo arredondado
   * inteiro, com respiro entre um e outro. A diferença não é decorativa: com
   * divisórias o olho lê uma TABELA e precisa varrer de cima a baixo; separados,
   * cada um vira um alvo isolado e a pessoa acerta o que quer sem ler os
   * vizinhos.
   *
   * O alvo de toque é o cartão inteiro, e não o texto: numa lista de ajustes o
   * dedo mira a linha.
   */
  /*
   * Sair NÃO RECEBE a classe do vidro, em vez de recebê-la e tentar desfazê-la.
   *
   * A primeira tentativa acrescentava `bg-transparent border-0` por cima do
   * `vidro-card` — e não funcionou: as duas são classes de mesma
   * especificidade, então quem vence é a que aparecer por último no CSS
   * gerado, o que ninguém controla. O cartão continuou lá.
   *
   * Anular o próprio estilo com outro estilo é sempre uma aposta na ordem do
   * arquivo. Não aplicar é determinístico.
   *
   * E ele não tem cartão porque na referência é assim: só o texto vermelho,
   * solto no fim da lista. Dar a ele a mesma caixa dos outros o transformaria
   * em mais uma opção de ajuste, quando ele é a saída.
   */
  const classe = perigo
    ? "flex w-full items-center gap-2.5 px-4 py-4 text-left"
    : cn(
        "vidro-card flex w-full items-center gap-2.5 rounded-[18px] px-4 py-[17px] text-left",
        "transition-transform active:scale-[0.99] motion-reduce:active:scale-100",
      );

  if (externo) {
    return (
      <a
        href={externo}
        target="_blank"
        rel="noopener noreferrer"
        className={classe}
      >
        {conteudo}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={classe}>
        {conteudo}
      </Link>
    );
  }

  return (
    <button type="button" onClick={aoTocar} className={classe}>
      {conteudo}
    </button>
  );
}

/**
 * O espaço entre as opções de um grupo.
 *
 * Era um cartão que embrulhava as linhas com divisórias. Virou só o respiro:
 * quem desenha a caixa agora é cada `Linha`.
 */
export function Grupo({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-2.5">{children}</div>;
}
