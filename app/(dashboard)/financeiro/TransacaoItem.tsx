"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { Valor } from "@/components/Valor";
import { iconePorCategoria } from "@/lib/categories";
import { LABEL_FORMA_PAGAMENTO } from "@/lib/formasPagamento";
import { cn } from "@/lib/utils";
import type { TransacaoComCliente } from "@/types";

const LARGURA_ACAO = 88;
const LIMIAR_ABERTURA = -44;

export function TransacaoItem({
  transacao,
  primeiro,
  onExcluir,
}: {
  transacao: TransacaoComCliente;
  primeiro: boolean;
  onExcluir: () => void;
}) {
  const router = useRouter();
  const [deslocamento, setDeslocamento] = useState(0);
  const arrasto = useRef<{ inicioX: number; inicioDeslocamento: number } | null>(
    null,
  );

  function aoPressionar(event: PointerEvent) {
    arrasto.current = { inicioX: event.clientX, inicioDeslocamento: deslocamento };
  }

  function aoMover(event: PointerEvent) {
    if (!arrasto.current) return;
    const delta = event.clientX - arrasto.current.inicioX;
    const novo = Math.min(
      0,
      Math.max(-LARGURA_ACAO, arrasto.current.inicioDeslocamento + delta),
    );
    setDeslocamento(novo);
  }

  function aoSoltar() {
    if (!arrasto.current) return;
    arrasto.current = null;
    setDeslocamento((atual) => (atual < LIMIAR_ABERTURA ? -LARGURA_ACAO : 0));
  }

  const positiva = transacao.tipo === "entrada";
  const parcelada = transacao.parcelas > 1;
  const IconeCategoria = iconePorCategoria(transacao.categoria);
  const arrastada = deslocamento !== 0;

  /*
   * A segunda linha é MONTADA, e some quando não tem o que dizer.
   *
   * Antes ela imprimia um travessão quando não havia forma de pagamento — e
   * lançamentos pendentes (fiado, aluguel a vencer) nunca têm uma, então metade
   * da lista ficava com um risco solto embaixo do nome, que parece defeito.
   * Sem nada a dizer, a linha não existe e a de cima se centraliza sozinha.
   */
  const apoio = [
    transacao.forma_pagamento
      ? LABEL_FORMA_PAGAMENTO[transacao.forma_pagamento]
      : null,
    // A categoria só entra quando o título é a descrição: se não houver
    // descrição, a categoria JÁ É o título, e repeti-la logo abaixo é eco.
    transacao.descricao ? transacao.categoria : null,
    parcelada ? `${transacao.parcela_atual}/${transacao.parcelas}` : null,
  ].filter(Boolean);

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        // O fio separador mora AQUI, no trilho, e não na linha que desliza:
        // preso à linha, ele viajaria junto com ela e a lista pareceria se
        // desmontar durante o arrasto.
        !primeiro && "border-t border-white/[0.08]",
      )}
    >
      {/*
        O botão vermelho só EXISTE enquanto a linha está arrastada.

        Antes ele ficava sempre montado atrás da linha. Enquanto a linha era
        opaca, ninguém via; no dia em que ela virou vidro, o vermelho atravessou
        todas as linhas ao mesmo tempo e a lista inteira ficou vermelha. O
        conserto não é voltar a linha para opaca — é não desenhar o que não
        deveria estar visível.
      */}
      {arrastada && (
        <button
          type="button"
          onClick={onExcluir}
          style={{ width: LARGURA_ACAO }}
          className="absolute inset-y-0 right-0 flex items-center justify-center bg-erro text-[13px] font-bold text-white"
        >
          Excluir
        </button>
      )}

      <div
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        onClick={() => {
          if (deslocamento === 0) router.push(`/financeiro/${transacao.id}`);
        }}
        style={{ transform: `translateX(${deslocamento}px)` }}
        className={cn(
          "relative flex touch-pan-y cursor-pointer items-center gap-3 px-4 py-3.5 transition-transform",
          // Parada, a linha é transparente e o néon do papel de parede passa
          // por baixo dela, como em todo o resto do app. Arrastada, ela precisa
          // de corpo para tapar o vermelho que aparece atrás — é o trabalho
          // dela naquele instante, e só naquele instante.
          arrastada && "bg-superficie",
        )}
      >
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-neutro-muted-strong">
          <IconeCategoria className="h-4 w-4" strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] leading-tight text-escuro">
            {transacao.descricao || transacao.categoria || "Sem descrição"}
            {transacao.cliente ? ` · ${transacao.cliente.nome}` : ""}
          </p>
          {apoio.length > 0 && (
            <p className="mt-0.5 truncate text-[13px] text-neutro-muted">
              {apoio.join(" · ")}
            </p>
          )}
        </div>

        {/*
          A entrada usa o néon da marca e a saída o texto comum — e não o par
          verde/vermelho de antes.

          Uma lista de contas do mês ficava metade em vermelho de erro, como se
          cada despesa paga fosse um problema do sistema. Gastar faz parte do
          negócio; o que a cor precisa dizer aqui é só qual das duas colunas a
          linha pertence.
        */}
        <span
          className={cn(
            "flex flex-shrink-0 items-baseline gap-1 text-[15px] font-bold",
            positiva ? "text-primary-forte" : "text-escuro",
          )}
        >
          {positiva ? "+" : "−"}
          <Valor valor={Number(transacao.valor)} />
        </span>
      </div>
    </div>
  );
}
