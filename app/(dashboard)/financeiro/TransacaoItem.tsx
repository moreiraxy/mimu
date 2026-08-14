"use client";

import { useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/formatters";
import { iconePorCategoria } from "@/lib/categories";
import { LABEL_FORMA_PAGAMENTO } from "@/lib/formasPagamento";
import type { TransacaoComCliente } from "@/types";

const LARGURA_ACAO = 88;
const LIMIAR_ABERTURA = -44;

export function TransacaoItem({
  transacao,
  onExcluir,
}: {
  transacao: TransacaoComCliente;
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

  return (
    <div className="relative overflow-hidden rounded-card">
      <button
        type="button"
        onClick={onExcluir}
        style={{ width: LARGURA_ACAO }}
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-erro text-sm font-semibold text-white"
      >
        Excluir
      </button>

      <div
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        onClick={() => {
          if (deslocamento === 0) router.push(`/financeiro/${transacao.id}`);
        }}
        style={{ transform: `translateX(${deslocamento}px)` }}
        className="relative flex touch-pan-y cursor-pointer items-center gap-3 bg-superficie p-3 transition-transform"
      >
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-fundo text-neutro-muted-strong">
          <IconeCategoria className="h-4 w-4" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-escuro">
            {transacao.descricao || transacao.categoria || "Sem descrição"}
            {transacao.cliente ? ` · ${transacao.cliente.nome}` : ""}
          </p>
          <p className="text-xs text-neutro-muted">
            {transacao.forma_pagamento
              ? LABEL_FORMA_PAGAMENTO[transacao.forma_pagamento]
              : "—"}
            {parcelada ? ` · ${transacao.parcela_atual}/${transacao.parcelas}` : ""}
          </p>
        </div>
        <p
          className={`flex-shrink-0 text-sm font-semibold ${positiva ? "text-verde-texto" : "text-erro-texto"}`}
        >
          {positiva ? "+" : "−"} {formatCurrency(Number(transacao.valor))}
        </p>
      </div>
    </div>
  );
}
