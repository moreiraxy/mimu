"use client";

import { AlertTriangle, ArrowRight, Check, Clock, Zap } from "lucide-react";
import {
  paraHora,
  REGRA_DE_PRIORIDADE,
  type EstadoDaRotina,
} from "@/lib/posto/rotina";
import { JORNADA_ACORDADA } from "@/lib/posto/cargos";
import { cn } from "@/lib/utils";

/**
 * O cartão de "agora" — a única coisa desta tela que responde à pergunta que
 * ela faz dez vezes por dia: o que eu deveria estar fazendo neste minuto.
 *
 * Fica sozinho no alto e grande de propósito. Enfiado numa grade com os
 * outros, ele viraria mais um cartão para procurar; e a hora em que ela mais
 * precisa dele é justamente a hora em que não sobra atenção para procurar.
 */
export function AgoraCard({
  rotina,
  onMarcar,
}: {
  rotina: EstadoDaRotina;
  onMarcar: (bloco: string) => void;
}) {
  const atrasados = rotina.atrasados;

  if (rotina.antesDaJornada || rotina.depoisDaJornada) {
    return (
      <section className="vidro-card rounded-[20px] p-5">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-neutro-muted">
          {rotina.antesDaJornada ? "Antes da jornada" : "Jornada encerrada"}
        </p>
        <p className="mt-2 text-xl font-bold text-escuro">
          {rotina.antesDaJornada
            ? `O dia acordado começa às ${JORNADA_ACORDADA.inicio}`
            : `O dia acordado terminou às ${JORNADA_ACORDADA.fim}`}
        </p>
        <p className="mt-1 text-sm text-neutro-muted">
          {rotina.depoisDaJornada
            ? "O corte das 19h é de outro executivo. O que sobrou aqui embaixo fica para amanhã."
            : "Leads que entraram fora do horário são o primeiro bloco: chegaram sem ninguém para atender."}
        </p>
        {atrasados.length > 0 && (
          <p className="mt-3 text-sm font-semibold text-ambar-texto">
            {atrasados.length}{" "}
            {atrasados.length === 1 ? "bloco não marcado" : "blocos não marcados"}{" "}
            no dia.
          </p>
        )}
      </section>
    );
  }

  const agora = rotina.agora;

  return (
    <section className="vidro-card rounded-[20px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[13px] font-semibold uppercase tracking-wide text-primary-forte">
            <Clock className="size-3.5" /> Agora
          </p>
          <h2 className="mt-2 text-2xl font-bold leading-tight text-escuro">
            {agora ? agora.label : "Nada marcado para este horário"}
          </h2>
          {agora && (
            <p className="mt-1 text-sm text-neutro-muted">
              {paraHora(agora.inicio)} às {paraHora(agora.fim)} · {agora.detalhe}
            </p>
          )}
          {!agora && rotina.proximo && (
            <p className="mt-1 text-sm text-neutro-muted">
              Próximo: {rotina.proximo.label}, às{" "}
              {paraHora(rotina.proximo.inicio)}.
            </p>
          )}
        </div>
        {agora && (
          <button
            type="button"
            onClick={() => onMarcar(agora.chave)}
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-text transition active:scale-95"
            aria-label={`Marcar "${agora.label}" como feito`}
          >
            <Check className="size-5" />
          </button>
        )}
      </div>

      {/* Dois blocos ao mesmo tempo acontece de verdade às 12:00: o corte e a
          ativação começam juntos, e o documento não resolve o empate. A tela
          mostra os dois em vez de escolher por ela. */}
      {rotina.tambemAgora.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-neutro-border pt-3">
          {rotina.tambemAgora.map((bloco) => (
            <button
              key={bloco.chave}
              type="button"
              onClick={() => onMarcar(bloco.chave)}
              className="flex w-full items-center gap-2 text-left text-sm text-escuro"
            >
              <span className="flex size-5 items-center justify-center rounded-full border border-neutro-border" />
              <span>
                Ao mesmo tempo: <strong>{bloco.label}</strong>
              </span>
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 flex items-center gap-2 rounded-card bg-primary-light px-3 py-2 text-[13px] font-semibold text-primary-forte">
        <Zap className="size-4 shrink-0" /> {REGRA_DE_PRIORIDADE}
      </p>

      {atrasados.length > 0 && (
        <div className="mt-3 rounded-card border border-ambar-soft bg-ambar-light p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-ambar-texto">
            <AlertTriangle className="size-4" /> Passou da hora e não foi marcado
          </p>
          <ul className="mt-2 space-y-1">
            {atrasados.map((bloco) => (
              <li key={bloco.chave}>
                <button
                  type="button"
                  onClick={() => onMarcar(bloco.chave)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 text-left text-sm text-escuro",
                    "hover:text-primary-forte",
                  )}
                >
                  <span>
                    {paraHora(bloco.inicio)} · {bloco.label}
                  </span>
                  <ArrowRight className="size-4 shrink-0 opacity-60" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
