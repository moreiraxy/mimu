"use client";

import { useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { salvarCorrecaoMimu } from "@/lib/mimu-correcao";
import {
  faixaDeHoras,
  mesmoDia,
  minutosDoDia,
  posicionar,
} from "@/lib/agenda/grade";
import type { AgendamentoComCliente, StatusAgendamento } from "@/types";
import { cn } from "@/lib/utils";

/**
 * A grade de horário — o formato do Google Agenda.
 *
 * POR QUE EXISTE. As três visões da agenda eram LISTAS: o dia era uma pilha de
 * cartões, a semana era sete pilhas lado a lado. Lista responde "o que tem
 * hoje" e não responde a pergunta que ela faz o dia inteiro, que é "às 15h eu
 * estou livre?". Palavras dela: "a agenda deve ser igual ao sistema do google
 * agendas, e a visualização tb".
 *
 * A diferença entre lista e grade é o VAZIO. Numa lista, o buraco entre duas
 * reuniões não existe; na grade ele tem altura, e é nele que ela marca.
 *
 * COMO O EVENTO É POSICIONADO. `top` pelo minuto de início, `height` pela
 * duração (mínimo de 30 minutos, senão um evento de 15 fica sem área de
 * toque). Sobreposição é resolvida por empacotamento: eventos que se cruzam
 * dividem a largura da coluna, como no Google.
 *
 * O FUSO. `data_hora` é timestamptz e aqui a leitura é LOCAL, com
 * `getHours()` — igual ao que DiaView, SemanaView e MesView já faziam. É
 * correto no navegador dela (que está em Brasília) e é o que mantém a grade
 * coerente com o resto da tela. Isto NÃO vale no servidor, e por isso nada
 * neste arquivo roda lá: `"use client"` na primeira linha não é detalhe.
 */

/** Altura de uma hora, em pixels. 56 deixa um evento de 30min com 28px. */
const ALTURA_HORA = 56;
const LARGURA_REGUA = 48;

const COR_STATUS: Record<StatusAgendamento, string> = {
  // Sem cor de categoria: na paleta grafite o que distingue é o preenchimento.
  // Confirmado é cheio; pendente é tracejado; concluído desbota; faltou fica
  // com o vermelho, que é a única cor que sobrou de propósito.
  confirmado: "bg-escuro/[0.08] border-escuro/25 text-escuro",
  pendente:
    "bg-transparent border-dashed border-escuro/30 text-neutro-muted-strong",
  concluido: "bg-escuro/[0.04] border-escuro/15 text-neutro-muted",
  nao_compareceu: "bg-erro-light border-erro/40 text-erro-texto",
};

export function GradeDeHorario({
  dias,
  agendamentos,
  agora = new Date(),
  mostrarCabecalho = true,
}: {
  /** Um dia (visão de dia) ou sete (visão de semana). */
  dias: Date[];
  agendamentos: AgendamentoComCliente[];
  agora?: Date;
  mostrarCabecalho?: boolean;
}) {
  const router = useRouter();
  const corpo = useRef<HTMLDivElement>(null);

  // A faixa de horas abre no padrão e ESTICA para caber o que existe. Sem
  // isso, uma reunião às 6h ou um corte às 23h simplesmente não apareceria —
  // e não apareceria em silêncio, que é o pior jeito de uma agenda falhar.
  const { horaInicial, horaFinal } = useMemo(
    () => faixaDeHoras(agendamentos),
    [agendamentos],
  );

  const horas = Array.from(
    { length: horaFinal - horaInicial },
    (_, i) => horaInicial + i,
  );
  const alturaTotal = horas.length * ALTURA_HORA;

  function aoClicarNoVazio(dia: Date, evento: React.MouseEvent<HTMLDivElement>) {
    const caixa = evento.currentTarget.getBoundingClientRect();
    const minutos =
      horaInicial * 60 +
      ((evento.clientY - caixa.top) / ALTURA_HORA) * 60;
    // Encaixa de 30 em 30, como o Google faz.
    const arredondado = Math.round(minutos / 30) * 30;
    const hora = String(Math.floor(arredondado / 60)).padStart(2, "0");
    const minuto = String(arredondado % 60).padStart(2, "0");
    const data = `${dia.getFullYear()}-${String(dia.getMonth() + 1).padStart(2, "0")}-${String(dia.getDate()).padStart(2, "0")}`;

    /*
     * O horário vai por sessionStorage, não por query string.
     *
     * É o mesmo repasse que o chat da Mimu usa para abrir o formulário
     * preenchido (lib/mimu-correcao.ts), e a razão de ser assim está lá: o
     * formulário de agendamento recebe nome de cliente e valor, e nada disso
     * deve ficar no histórico do navegador nem no log de acesso. Reusar o
     * canal existente também evita um segundo jeito de pré-preencher a mesma
     * tela.
     */
    salvarCorrecaoMimu({ data, horario: `${hora}:${minuto}` });
    router.push("/agenda/novo");
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-neutro-border">
      {mostrarCabecalho && (
        <div
          className="grid border-b border-neutro-border bg-superficie/60"
          style={{
            gridTemplateColumns: `${LARGURA_REGUA}px repeat(${dias.length}, minmax(0, 1fr))`,
          }}
        >
          <div />
          {dias.map((dia) => {
            const ehHoje = mesmoDia(dia, agora);
            return (
              <div
                key={dia.toISOString()}
                className="border-l border-neutro-border px-1 py-2 text-center"
              >
                <p className="text-[10px] font-bold uppercase tracking-wide text-neutro-muted">
                  {dia
                    .toLocaleDateString("pt-BR", { weekday: "short" })
                    .replace(".", "")}
                </p>
                <p
                  className={cn(
                    "mx-auto mt-0.5 flex size-6 items-center justify-center rounded-full text-[13px] font-bold tabular-nums",
                    ehHoje
                      ? "bg-primary text-primary-text"
                      : "text-escuro",
                  )}
                >
                  {dia.getDate()}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="max-h-[70vh] overflow-y-auto">
        <div
          ref={corpo}
          className="relative grid"
          style={{
            gridTemplateColumns: `${LARGURA_REGUA}px repeat(${dias.length}, minmax(0, 1fr))`,
            height: alturaTotal,
          }}
        >
          {/* A régua das horas. `-translate-y-1/2` põe o número NA linha, e não
              acima dela — é onde o Google o põe, e é o que faz a leitura
              bater com o traço. */}
          <div className="relative">
            {horas.map((hora, indice) => (
              <span
                key={hora}
                className="absolute right-1.5 font-mono text-[10px] tabular-nums text-neutro-muted"
                style={{ top: indice * ALTURA_HORA - 5 }}
              >
                {indice === 0 ? "" : `${String(hora).padStart(2, "0")}h`}
              </span>
            ))}
          </div>

          {dias.map((dia) => {
            const doDia = agendamentos.filter((item) =>
              mesmoDia(new Date(item.data_hora), dia),
            );
            const posicionados = posicionar(doDia);
            const ehHoje = mesmoDia(dia, agora);
            const minutosAgora = minutosDoDia(agora);
            const agoraNaFaixa =
              ehHoje &&
              minutosAgora >= horaInicial * 60 &&
              minutosAgora <= horaFinal * 60;

            return (
              <div
                key={dia.toISOString()}
                className="relative border-l border-neutro-border"
                onClick={(evento) => aoClicarNoVazio(dia, evento)}
                role="presentation"
              >
                {/* Os fios de hora. O da meia hora é mais claro, como no
                    Google — ajuda a mirar os :30 sem contar. */}
                {horas.map((hora, indice) => (
                  <div key={hora}>
                    <div
                      className="absolute inset-x-0 border-t border-neutro-border"
                      style={{ top: indice * ALTURA_HORA }}
                    />
                    <div
                      className="absolute inset-x-0 border-t border-neutro-border/40"
                      style={{ top: indice * ALTURA_HORA + ALTURA_HORA / 2 }}
                    />
                  </div>
                ))}

                {posicionados.map(({ item, inicio, fim, coluna, colunas }) => {
                  const largura = 100 / colunas;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={(evento) => {
                        evento.stopPropagation();
                        router.push(`/agenda/${item.id}`);
                      }}
                      className={cn(
                        "absolute overflow-hidden rounded border px-1.5 py-1 text-left",
                        COR_STATUS[item.status],
                      )}
                      style={{
                        top:
                          ((inicio - horaInicial * 60) / 60) * ALTURA_HORA + 1,
                        height: ((fim - inicio) / 60) * ALTURA_HORA - 2,
                        left: `calc(${coluna * largura}% + 2px)`,
                        width: `calc(${largura}% - 4px)`,
                      }}
                    >
                      <span className="block truncate text-[11px] font-bold leading-tight">
                        {new Date(item.data_hora).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="block truncate text-[11px] leading-tight">
                        {item.titulo}
                      </span>
                      {item.cliente?.nome && (
                        <span className="block truncate text-[10px] leading-tight opacity-70">
                          {item.cliente.nome}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* A linha de agora. É a única coisa vermelha da tela, e é
                    assim no Google pelo mesmo motivo: é a referência que a
                    pessoa procura antes de qualquer evento. */}
                {agoraNaFaixa && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-erro"
                    style={{
                      top:
                        ((minutosAgora - horaInicial * 60) / 60) * ALTURA_HORA,
                    }}
                  >
                    <span className="absolute -left-1 -top-[5px] size-2 rounded-full bg-erro" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
