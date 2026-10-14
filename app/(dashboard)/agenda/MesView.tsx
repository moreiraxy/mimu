"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, paraISOLocal } from "@/lib/utils";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AgendamentoComCliente } from "@/types";

const DIAS_SEMANA = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** Quantos eventos caem numa célula antes de virar "+N". */
const EVENTOS_POR_CELULA = 3;

/**
 * O mês no formato do Google Agenda.
 *
 * O QUE ESTAVA AQUI: um quadradinho por dia com a CONTAGEM de agendamentos, e
 * o comentário antigo defendia essa escolha — "num quadrado de 44px não cabe
 * 'Corte + escova às 14h'". O argumento era correto para um quadrado de 44px
 * numa tela de celular.
 *
 * O que mudou foi a tela. Esta agenda agora é usada num computador, onde a
 * célula tem mais de 100px de largura e três linhas de altura — e aí a
 * contagem passa a esconder de graça o que cabe: "14h Dyego" numa linha diz o
 * que "3" nunca vai dizer. No celular as células ficam estreitas e mostram o
 * ponto e a hora; o nome entra quando há espaço.
 *
 * A GRADE É FIXA EM SEIS SEMANAS, sempre. Um mês que começa no domingo precisa
 * de seis linhas; um fevereiro alinhado precisa de quatro. Variar a altura faz
 * a tela inteira pular ao trocar de mês, e é por isso que o Google também fixa.
 *
 * Os dias do mês vizinho aparecem apagados em vez de vazios: a semana que
 * cruza a virada do mês é uma semana de trabalho como qualquer outra.
 */
export function MesView({
  dataReferencia,
  onMudarMes,
  onSelecionarDia,
}: {
  dataReferencia: string;
  onMudarMes: (dataISO: string) => void;
  onSelecionarDia: (dataISO: string) => void;
}) {
  const router = useRouter();
  const referencia = new Date(`${dataReferencia}T00:00:00`);
  const ano = referencia.getFullYear();
  const mes = referencia.getMonth();

  // A grade começa na segunda anterior ao dia 1 e tem 42 células.
  const { celulas, inicioISO, fimISO } = useMemo(() => {
    const primeiro = new Date(ano, mes, 1);
    const inicio = new Date(primeiro);
    inicio.setDate(inicio.getDate() - ((primeiro.getDay() + 6) % 7));
    const lista = Array.from({ length: 42 }, (_, i) => {
      const dia = new Date(inicio);
      dia.setDate(dia.getDate() + i);
      return dia;
    });
    return {
      celulas: lista,
      inicioISO: paraISOLocal(lista[0]!),
      fimISO: paraISOLocal(lista[41]!),
    };
  }, [ano, mes]);

  const { agendamentos, loading } = useAgendamentos(inicioISO, fimISO);
  const hojeISO = paraISOLocal(new Date());

  const porDia = useMemo(() => {
    const mapa = new Map<string, AgendamentoComCliente[]>();
    for (const item of agendamentos) {
      const iso = paraISOLocal(new Date(item.data_hora));
      const lista = mapa.get(iso) ?? [];
      lista.push(item);
      mapa.set(iso, lista);
    }
    for (const lista of mapa.values()) {
      lista.sort(
        (a, b) =>
          new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime(),
      );
    }
    return mapa;
  }, [agendamentos]);

  function trocarMes(delta: number) {
    onMudarMes(paraISOLocal(new Date(ano, mes + delta, 1)));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          aria-label="Mês anterior"
          onClick={() => trocarMes(-1)}
          className="flex size-8 items-center justify-center rounded-full text-escuro hover:bg-escuro/[0.06]"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-[13px] font-bold text-escuro">
          {MESES[mes]} de {ano}
        </p>
        <button
          type="button"
          aria-label="Próximo mês"
          onClick={() => trocarMes(1)}
          className="flex size-8 items-center justify-center rounded-full text-escuro hover:bg-escuro/[0.06]"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {loading ? (
        <Skeleton className="h-[60vh] w-full rounded-[10px]" />
      ) : (
        <div className="overflow-hidden rounded-[10px] border border-neutro-border">
          <div className="grid grid-cols-7 border-b border-neutro-border bg-superficie/60">
            {DIAS_SEMANA.map((dia) => (
              <p
                key={dia}
                className="py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-neutro-muted"
              >
                {dia}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {celulas.map((dia) => {
              const iso = paraISOLocal(dia);
              const doDia = porDia.get(iso) ?? [];
              const doMes = dia.getMonth() === mes;
              const ehHoje = iso === hojeISO;

              return (
                <div
                  key={iso}
                  role="presentation"
                  onClick={() => onSelecionarDia(iso)}
                  className={cn(
                    "min-h-[88px] border-b border-l border-neutro-border p-1 first:border-l-0 [&:nth-child(7n+1)]:border-l-0",
                    !doMes && "bg-escuro/[0.02]",
                  )}
                >
                  <p
                    className={cn(
                      "mb-0.5 flex size-5 items-center justify-center rounded-full text-[11px] font-bold tabular-nums",
                      ehHoje && "bg-primary text-primary-text",
                      !ehHoje && doMes && "text-escuro",
                      !ehHoje && !doMes && "text-neutro-muted",
                    )}
                  >
                    {dia.getDate()}
                  </p>

                  <div className="flex flex-col gap-0.5">
                    {doDia.slice(0, EVENTOS_POR_CELULA).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={(evento) => {
                          evento.stopPropagation();
                          router.push(`/agenda/${item.id}`);
                        }}
                        className={cn(
                          "flex items-center gap-1 overflow-hidden rounded px-1 py-[1px] text-left text-[10px] leading-tight",
                          item.status === "nao_compareceu"
                            ? "bg-erro-light text-erro-texto"
                            : "bg-escuro/[0.07] text-escuro",
                        )}
                      >
                        <span className="font-mono tabular-nums opacity-70">
                          {new Date(item.data_hora).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="truncate">{item.titulo}</span>
                      </button>
                    ))}

                    {doDia.length > EVENTOS_POR_CELULA && (
                      <span className="px-1 text-[10px] font-semibold text-neutro-muted">
                        +{doDia.length - EVENTOS_POR_CELULA} mais
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
