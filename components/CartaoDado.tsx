"use client";

import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { Valor } from "@/components/Valor";
import { cn } from "@/lib/utils";

/**
 * O cartão de dado, no formato da referência.
 *
 * Todo cartão dela tem a MESMA anatomia, e é isso que faz as telas parecerem
 * uma coisa só: um gráfico ou ícone no alto à esquerda, uma seta no alto à
 * direita, e embaixo o rótulo miúdo com o valor grande logo abaixo.
 *
 * A ordem importa e é contraintuitiva: o RÓTULO vem antes do VALOR, e o valor
 * é o que fica grande. Nossos cartões faziam o contrário — rótulo pequeno em
 * cima e valor em corpo médio — e o resultado é uma tela onde nada se destaca,
 * porque tudo tem quase o mesmo tamanho.
 *
 * O espaço vazio entre o topo e o rodapé é de propósito: é ele que empurra o
 * valor para baixo e dá ao cartão o peso que a referência tem. Cartão que se
 * encolhe até o conteúdo vira uma lista de linhas.
 */
export function CartaoDado({
  icone: Icone,
  grafico,
  rotulo,
  valor,
  texto,
  detalhe,
  href,
  corDoValor,
  className,
}: {
  icone?: LucideIcon;
  /** Um gráfico no lugar do ícone — anel, curva, barra. */
  grafico?: React.ReactNode;
  rotulo: string;
  /** Em dinheiro: passa por <Valor> e obedece ao olho de esconder. */
  valor?: number;
  /** Quando não é dinheiro — "Sem vencimento", "3 hoje". */
  texto?: string;
  /** A linha miúda embaixo do valor. */
  detalhe?: string;
  href?: string;
  corDoValor?: string;
  className?: string;
}) {
  const conteudo = (
    <>
      <div className="flex items-start justify-between">
        {/*
          O GRÁFICO É GRANDE, e é ele que dá peso ao widget.

          Antes era um ícone de traço de 22px numa caixa de 40 — some dentro do
          cartão e o resultado é uma caixa quase vazia com um número no pé. Na
          referência esse lugar tem um anel grosso ou um ícone dentro de um
          DISCO CHEIO, ocupando perto de um terço da largura do cartão. É o que
          o olho encontra primeiro; o número embaixo é a legenda dele.
        */}
        {grafico ??
          (Icone ? (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-escuro/[0.07] text-escuro">
              <Icone className="h-[19px] w-[19px]" strokeWidth={1.75} />
            </span>
          ) : (
            <span />
          ))}
        {href && (
          <ChevronRight
            className="h-[18px] w-[18px] flex-shrink-0 text-neutro-muted"
            strokeWidth={2}
          />
        )}
      </div>

      {/*
        Três níveis, sempre nesta ordem: rótulo miúdo, valor grande, e a linha
        secundária. É a hierarquia da referência — e o terceiro nível não é
        detalhe decorativo: é o "de R$ 0,00" que dá sentido ao número de cima.
      */}
      <div className="mt-auto min-w-0">
        {/* 15px, medido na referência — eu tinha posto 13 e o rótulo sumia
            debaixo do valor. */}
        <p className="truncate text-[15px] leading-tight text-neutro-muted">
          {rotulo}
        </p>
        {valor !== undefined ? (
          <Valor
            valor={valor}
            className={cn(
              "mt-0.5 block truncate text-[24px] font-bold leading-tight tracking-tight",
              corDoValor ?? "text-escuro",
            )}
          />
        ) : (
          <p
            className={cn(
              "mt-0.5 truncate text-[24px] font-bold leading-tight tracking-tight",
              corDoValor ?? "text-escuro",
            )}
          >
            {texto}
          </p>
        )}
        {detalhe && (
          <p className="mt-0.5 truncate text-[13px] leading-tight text-neutro-muted">
            {detalhe}
          </p>
        )}
      </div>
    </>
  );

  /*
   * `h-full` e não `min-h`: quem manda na altura é a caixa do widget, que tem
   * proporção fixa (ver CLASSES_TAMANHO em lib/widgets.ts). Altura vinda do
   * conteúdo era o que fazia os cartões terminarem em linhas diferentes.
   *
   * O raio subiu para 26px: é a proporção da referência (cerca de 8% da
   * largura do cartão), e é o que faz a peça ler como widget de sistema em vez
   * de cartão de site.
   */
  const classe = cn(
    "vidro-card flex h-full min-h-[196px] flex-col overflow-hidden rounded-[20px] p-4",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={classe}>
        {conteudo}
      </Link>
    );
  }
  return <div className={classe}>{conteudo}</div>;
}
