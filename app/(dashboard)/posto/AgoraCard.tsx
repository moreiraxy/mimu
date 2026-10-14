"use client";

import { Check, ChevronDown, Zap } from "lucide-react";
import { useState } from "react";
import { Anel } from "@/components/graficos/Anel";
import {
  paraHora,
  REGRA_DE_PRIORIDADE,
  ROTINA,
  type EstadoDaRotina,
} from "@/lib/posto/rotina";
import { JORNADA_ACORDADA } from "@/lib/posto/cargos";
import { cn } from "@/lib/utils";
import { BLOCO } from "./estilos";

/**
 * O "agora" — o herói da tela.
 *
 * A PRIMEIRA VERSÃO ERA UM MURO DE TEXTO e ela disse isso com essas palavras:
 * "texto demais", "feia, sem cara de painel". Cada bloco vinha com o detalhe
 * completo embaixo, a regra de prioridade em caixa própria, os atrasados
 * listados por extenso — quatro parágrafos antes de responder a única pergunta
 * que o cartão existe para responder.
 *
 * Agora responde em uma linha, com a anatomia que o resto do app usa (ver
 * components/CartaoDado.tsx): gráfico à esquerda, rótulo miúdo, valor grande.
 * O detalhe do bloco e a lista de atrasados existem, mas atrás de um toque.
 */
export function AgoraCard({
  rotina,
  onMarcar,
}: {
  rotina: EstadoDaRotina;
  onMarcar: (bloco: string) => void;
}) {
  const [verAtrasados, setVerAtrasados] = useState(false);
  const feitos = rotina.feitos.length;
  const progresso = Math.round((feitos / ROTINA.length) * 100);
  const agora = rotina.agora;
  const foraDaJornada = rotina.antesDaJornada || rotina.depoisDaJornada;

  return (
    <section className={BLOCO}>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <Anel progresso={progresso} tamanho={64} />
          <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-escuro">
            {feitos}/{ROTINA.length}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold uppercase tracking-wide text-primary-forte">
            {foraDaJornada
              ? rotina.antesDaJornada
                ? `Começa ${JORNADA_ACORDADA.inicio}`
                : "Dia encerrado"
              : "Agora"}
          </p>
          <h2 className="truncate text-xl font-bold leading-tight text-escuro">
            {agora
              ? agora.label
              : rotina.proximo
                ? rotina.proximo.label
                : "Nada pendente"}
          </h2>
          <p className="truncate text-[13px] text-neutro-muted">
            {agora
              ? `até ${paraHora(agora.fim)}`
              : rotina.proximo
                ? `às ${paraHora(rotina.proximo.inicio)}`
                : "Rotina do dia fechada"}
          </p>
        </div>

        {agora && (
          <button
            type="button"
            onClick={() => onMarcar(agora.chave)}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-text transition active:scale-95"
            aria-label={`Marcar "${agora.label}" como feito`}
          >
            <Check className="size-5" strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Dois blocos começam às 12:00 — o corte e a ativação. Uma linha, sem
          explicação: tocar marca. */}
      {rotina.tambemAgora.map((bloco) => (
        <button
          key={bloco.chave}
          type="button"
          onClick={() => onMarcar(bloco.chave)}
          className="mt-2 flex w-full items-center gap-2 rounded-card px-2 py-1.5 text-left text-[13px] text-escuro"
        >
          <span className="size-4 shrink-0 rounded-full border border-neutro-border" />
          <span className="truncate">também: {bloco.label}</span>
        </button>
      ))}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 rounded-full bg-primary-light px-2.5 py-1 text-[12px] font-bold text-primary-forte">
          <Zap className="size-3.5" /> {REGRA_DE_PRIORIDADE}
        </span>

        {rotina.atrasados.length > 0 && (
          <button
            type="button"
            onClick={() => setVerAtrasados((v) => !v)}
            aria-expanded={verAtrasados}
            className="flex items-center gap-1 rounded-full bg-ambar-light px-2.5 py-1 text-[12px] font-bold text-ambar-texto"
          >
            {rotina.atrasados.length} passou da hora
            <ChevronDown
              className={cn("size-3.5 transition", verAtrasados && "rotate-180")}
            />
          </button>
        )}
      </div>

      {verAtrasados && (
        <ul className="mt-2 space-y-0.5">
          {rotina.atrasados.map((bloco) => (
            <li key={bloco.chave}>
              <button
                type="button"
                onClick={() => onMarcar(bloco.chave)}
                className="flex w-full items-center gap-2 rounded-card px-2 py-1.5 text-left text-[13px] text-escuro"
              >
                <span className="size-4 shrink-0 rounded-full border border-ambar-soft" />
                <span className="font-mono text-neutro-muted">
                  {paraHora(bloco.inicio)}
                </span>
                <span className="truncate">{bloco.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
