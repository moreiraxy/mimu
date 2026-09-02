import { useMemo } from "react";
import { calcularFaturamentoPrevisto } from "@/lib/calculations";
import { Valor } from "@/components/Valor";
import { cn } from "@/lib/utils";
import { paraISOLocal } from "@/lib/utils";
import { AgendamentoLinha } from "./AgendamentoLinha";
import type { AgendamentoComCliente, Transacao } from "@/types";

export function VisaoHoje({
  transacoes,
  agendamentos,
}: {
  transacoes: Transacao[];
  agendamentos: AgendamentoComCliente[];
}) {
  const hojeISO = paraISOLocal(new Date());

  const { realizado, previsto, agendamentosHoje } = useMemo(() => {
    const transacoesHoje = transacoes.filter(
      (t) => t.data === hojeISO && t.tipo === "entrada",
    );
    const agendamentosHoje = agendamentos.filter(
      (a) => paraISOLocal(new Date(a.data_hora)) === hojeISO,
    );

    return {
      realizado: transacoesHoje.reduce((total, t) => total + Number(t.valor), 0),
      previsto: calcularFaturamentoPrevisto(agendamentosHoje),
      agendamentosHoje,
    };
  }, [transacoes, agendamentos, hojeISO]);

  const potencial = realizado + previsto;

  return (
    <div className="flex flex-col gap-4">
      {/*
        O POTENCIAL É O CARTÃO GRANDE, e realizado e previsto são as linhas que
        o explicam — a mesma anatomia do "Faturamento de hoje" do painel.

        Antes era o contrário: dois cartõezinhos com borda de 2px em cores
        diferentes (um verde sólido, outro néon tracejado) e, embaixo, o
        potencial num RETÂNGULO CHAPADO `bg-escuro` — que no tema escuro é
        branco, ou seja, a única placa branca de um app inteiro de vidro. O
        número mais importante da tela era o que mais destoava dela.
      */}
      <div className="vidro-card rounded-[20px] p-4">
        <p className="text-[15px] leading-tight text-neutro-muted">
          Potencial total do dia
        </p>
        <Valor
          valor={potencial}
          className="mt-1 block truncate text-[40px] font-bold leading-none tracking-tight text-escuro"
        />

        <div className="mt-4 flex flex-col gap-2">
          <LinhaDeApoio rotulo="Já realizado" valor={realizado} />
          {/* O previsto é o único em néon: é o que ainda pode acontecer, e a
              diferença entre os dois é o assunto desta tela. */}
          <LinhaDeApoio rotulo="Previsto" valor={previsto} destaque />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {agendamentosHoje.length === 0 ? (
          <p className="py-6 text-center text-[15px] text-neutro-muted">
            Nenhum agendamento hoje.
          </p>
        ) : (
          agendamentosHoje.map((agendamento) => (
            <AgendamentoLinha key={agendamento.id} agendamento={agendamento} />
          ))
        )}
      </div>
    </div>
  );
}

function LinhaDeApoio({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="truncate text-[15px] text-neutro-muted">{rotulo}</span>
      <Valor
        valor={valor}
        className={cn(
          "text-[15px] font-bold",
          destaque ? "text-primary-forte" : "text-escuro",
        )}
      />
    </div>
  );
}
