"use client";

import { useMemo } from "react";
import { calcularFaturamentoPrevisto } from "@/lib/calculations";
import { Valor } from "@/components/Valor";
import { GraficoDuasSeries } from "@/components/graficos/GraficoDuasSeries";
import { cn, paraISOLocal } from "@/lib/utils";
import { AgendamentoLinha } from "./AgendamentoLinha";
import type { AgendamentoComCliente, Transacao } from "@/types";

const DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function inicioDaSemana(referencia: Date): Date {
  const dia = new Date(referencia);
  const offset = (dia.getDay() + 6) % 7; // 0 = segunda
  dia.setDate(dia.getDate() - offset);
  dia.setHours(0, 0, 0, 0);
  return dia;
}

function formatarValorCompacto(valor: number): string {
  if (valor >= 1000) return `R$${(valor / 1000).toFixed(1)}k`;
  return `R$${Math.round(valor)}`;
}

export function VisaoSemana({
  transacoes,
  agendamentos,
}: {
  transacoes: Transacao[];
  agendamentos: AgendamentoComCliente[];
}) {
  const hojeISO = paraISOLocal(new Date());
  const inicioISO = useMemo(
    () => paraISOLocal(inicioDaSemana(new Date())),
    [],
  );

  const dias = useMemo(() => {
    const inicio = new Date(`${inicioISO}T00:00:00`);
    return Array.from({ length: 7 }, (_, i) => {
      const dia = new Date(inicio);
      dia.setDate(dia.getDate() + i);
      const iso = paraISOLocal(dia);

      const transacoesDoDia = transacoes.filter(
        (t) => t.data === iso && t.tipo === "entrada",
      );
      const agendamentosDoDia = agendamentos.filter(
        (a) => paraISOLocal(new Date(a.data_hora)) === iso,
      );

      return {
        iso,
        realizado: transacoesDoDia.reduce((s, t) => s + Number(t.valor), 0),
        previsto: calcularFaturamentoPrevisto(agendamentosDoDia),
        ehHoje: iso === hojeISO,
      };
    });
  }, [transacoes, agendamentos, inicioISO, hojeISO]);

  const fimISO = dias[6]!.iso;

  const realizadoSemana = dias.reduce((s, d) => s + d.realizado, 0);
  const previstoSemana = dias.reduce((s, d) => s + d.previsto, 0);
  const potencialSemana = realizadoSemana + previstoSemana;

  const maiorValor = Math.max(
    ...dias.map((d) => Math.max(d.realizado, d.previsto)),
    1,
  );

  const proximos = useMemo(() => {
    const agora = new Date();
    return agendamentos
      .filter((a) => {
        const iso = paraISOLocal(new Date(a.data_hora));
        return (
          new Date(a.data_hora) >= agora &&
          (a.status === "confirmado" || a.status === "pendente") &&
          iso >= inicioISO &&
          iso <= fimISO
        );
      })
      .sort(
        (a, b) =>
          new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime(),
      );
  }, [agendamentos, inicioISO, fimISO]);

  return (
    <div className="flex flex-col gap-4">
      {/*
        O MESMO gráfico de duas séries do financeiro, com linha ou coluna na
        escolha de quem usa (components/graficos/GraficoDuasSeries).

        Aqui só havia colunas, e nem sempre a coluna é a leitura certa: quem
        olha a semana quer saber PARA ONDE ela está indo, e isso a curva conta
        melhor. Faltava a opção porque este desenho era uma cópia do que existia
        no financeiro — quando a escolha nasceu lá, a cópia daqui ficou para
        trás. Agora é uma peça só, e o que melhora num lugar melhora nos dois.
      */}
      <GraficoDuasSeries
        titulo="A semana"
        principal={{ nome: "Realizado", valores: dias.map((d) => d.realizado) }}
        apoio={{ nome: "Previsto", valores: dias.map((d) => d.previsto) }}
        rotulos={DIAS_SEMANA}
        destaque={dias.findIndex((d) => d.ehHoje)}
        altura={140}
        rodape={
          <div className="mt-4 flex flex-col gap-2 border-t border-escuro/[0.08] pt-3.5">
            <LinhaDeApoio rotulo="Já realizado" valor={realizadoSemana} />
            <LinhaDeApoio rotulo="Previsto" valor={previstoSemana} destaque />
            <LinhaDeApoio rotulo="Potencial da semana" valor={potencialSemana} />
          </div>
        }
      />

      <div className="flex flex-col gap-2">
        <p className="px-1 text-[13px] font-semibold text-neutro-muted">
          Próximos agendamentos
        </p>
        {proximos.length === 0 ? (
          <p className="py-4 text-center text-[15px] text-neutro-muted">
            Nenhum agendamento futuro essa semana.
          </p>
        ) : (
          proximos.map((agendamento) => (
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
