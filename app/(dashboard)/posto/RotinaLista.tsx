"use client";

import { Check } from "lucide-react";
import {
  paraHora,
  ROTINA,
  type EstadoDaRotina,
  type TipoBloco,
} from "@/lib/posto/rotina";
import { cn } from "@/lib/utils";

/**
 * Os dez blocos do dia, em ordem, marcáveis.
 *
 * Linha do tempo e não grade: a rotina dela é sequência, e grade de cartões
 * perde a única informação que importa aqui, que é o que vem antes e o que vem
 * depois.
 *
 * As quatro CONFERÊNCIAS de fila (9:45, 12:00, 14:45, 17:00) ganham marca
 * própria. Elas são o tipo de tarefa que não reclama quando falta: o preço
 * aparece dias depois, num lead parado na fila de alguém que já foi cortado.
 *
 * O DETALHE DE CADA BLOCO SAIU DA TELA. Ele estava embaixo de cada uma das dez
 * linhas, e dez parágrafos empilhados é o que ela chamou de "texto demais" —
 * numa lista que ela conhece de cor, porque é a rotina dela. O texto continua
 * em lib/posto/rotina.ts, que é a fonte do acordo com o gerente, e aparece no
 * cartão de "agora" quando é a vez daquele bloco.
 */

const SELO: Record<TipoBloco, { texto: string; classe: string } | null> = {
  bloco: null,
  conferencia: {
    texto: "conferência",
    classe: "bg-primary-light text-primary-forte",
  },
  entrega: { texto: "entrega", classe: "bg-ambar-light text-ambar-texto" },
};

export function RotinaLista({
  rotina,
  onAlternar,
}: {
  rotina: EstadoDaRotina;
  onAlternar: (bloco: string, feito: boolean) => void;
}) {
  const feitos = new Set(rotina.feitos.map((b) => b.chave));
  const atrasados = new Set(rotina.atrasados.map((b) => b.chave));
  const agoraChave = rotina.agora?.chave;

  return (
    <section className="vidro-card rounded-[20px] p-5">
      <header className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-escuro">Rotina do dia</h2>
        <p className="text-[13px] text-neutro-muted">
          {feitos.size} de {ROTINA.length}
        </p>
      </header>

      <ol className="space-y-1">
        {ROTINA.map((bloco) => {
          const feito = feitos.has(bloco.chave);
          const selo = SELO[bloco.tipo];
          return (
            <li key={bloco.chave}>
              <button
                type="button"
                onClick={() => onAlternar(bloco.chave, !feito)}
                aria-pressed={feito}
                className={cn(
                  "flex w-full items-start gap-3 rounded-card px-2 py-2.5 text-left transition",
                  agoraChave === bloco.chave && "bg-primary-light/60",
                  !feito && atrasados.has(bloco.chave) && "bg-ambar-light/50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition",
                    feito
                      ? "border-primary bg-primary text-primary-text"
                      : "border-neutro-border",
                  )}
                >
                  {feito && <Check className="size-3.5" />}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-mono text-[13px] text-neutro-muted">
                      {paraHora(bloco.inicio)}
                      {bloco.tipo === "bloco" && `–${paraHora(bloco.fim)}`}
                    </span>
                    {selo && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
                          selo.classe,
                        )}
                      >
                        {selo.texto}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-[15px] font-semibold text-escuro",
                      feito && "line-through opacity-50",
                    )}
                  >
                    {bloco.label}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
