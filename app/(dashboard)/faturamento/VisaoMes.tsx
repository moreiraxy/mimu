"use client";

import { useMemo } from "react";
import { ProgressoCircular } from "@/components/ui/ProgressoCircular";
import {
  calcularFaturamentoPrevisto,
  calcularProgressoMeta,
  calcularProjecaoMensal,
} from "@/lib/calculations";
import { formatCurrency } from "@/lib/formatters";
import { cn, diasNoMesAtual, paraISOLocal } from "@/lib/utils";
import type { AgendamentoComCliente, Transacao } from "@/types";

export function VisaoMes({
  transacoes,
  agendamentos,
  metaMensal,
}: {
  transacoes: Transacao[];
  agendamentos: AgendamentoComCliente[];
  metaMensal: number;
}) {
  const dados = useMemo(() => {
    const agora = new Date();
    const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioMesISO = paraISOLocal(inicioMes);
    const inicioMesPassado = new Date(
      agora.getFullYear(),
      agora.getMonth() - 1,
      1,
    );
    const inicioMesPassadoISO = paraISOLocal(inicioMesPassado);

    const transacoesMes = transacoes.filter(
      (t) => t.data >= inicioMesISO && t.tipo === "entrada",
    );
    const realizadoMes = transacoesMes.reduce(
      (s, t) => s + Number(t.valor),
      0,
    );

    const agendamentosMes = agendamentos.filter(
      (a) => paraISOLocal(new Date(a.data_hora)) >= inicioMesISO,
    );
    const previstoRestante = calcularFaturamentoPrevisto(agendamentosMes);

    const transacoesMesPassado = transacoes.filter(
      (t) =>
        t.data >= inicioMesPassadoISO &&
        t.data < inicioMesISO &&
        t.tipo === "entrada",
    );
    const realizadoMesPassado = transacoesMesPassado.reduce(
      (s, t) => s + Number(t.valor),
      0,
    );

    const diasPassados = agora.getDate();
    const diasTotais = diasNoMesAtual();
    const projecao = calcularProjecaoMensal(
      realizadoMes,
      diasPassados,
      diasTotais,
    );

    const percentual = calcularProgressoMeta(realizadoMes, metaMensal);
    const variacaoVsMesPassado =
      realizadoMesPassado > 0
        ? Math.round(
            ((projecao - realizadoMesPassado) / realizadoMesPassado) * 100,
          )
        : null;

    return {
      realizadoMes,
      previstoRestante,
      realizadoMesPassado,
      projecao,
      percentual,
      variacaoVsMesPassado,
    };
  }, [transacoes, agendamentos, metaMensal]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center">
        <div className="relative flex h-[180px] w-[180px] items-center justify-center">
          <ProgressoCircular percentual={dados.percentual} />
          <div className="absolute flex flex-col items-center">
            <p className="text-2xl font-bold text-coral">
              {Math.round(dados.percentual)}%
            </p>
            <p className="text-xs text-neutro-muted">da meta</p>
          </div>
        </div>
        <p className="mt-2 text-sm text-neutro-muted">
          {metaMensal > 0
            ? `${formatCurrency(dados.realizadoMes)} de ${formatCurrency(metaMensal)}`
            : "Nenhuma meta mensal definida ainda"}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <CardMes
          label="Realizado"
          valor={formatCurrency(dados.realizadoMes)}
          cor="text-verde"
        />
        <CardMes
          label="Previsto restante"
          valor={formatCurrency(dados.previstoRestante)}
          cor="text-coral"
        />
        <CardMes
          label="Meta mensal"
          valor={metaMensal > 0 ? formatCurrency(metaMensal) : "—"}
          cor="text-escuro"
        />
      </div>

      <div className="rounded-card border border-neutro-border bg-superficie p-4">
        <p className="text-sm text-neutro-muted">
          No ritmo atual, você vai fechar o mês em
        </p>
        <p className="mt-1 text-xl font-bold text-escuro">
          {formatCurrency(dados.projecao)}
        </p>
      </div>

      <div className="rounded-card border border-neutro-border bg-superficie p-4">
        <p className="text-xs text-neutro-muted">Mês passado</p>
        <p className="text-sm font-semibold text-escuro">
          {formatCurrency(dados.realizadoMesPassado)}
        </p>
        {dados.variacaoVsMesPassado !== null && (
          <p
            className={cn(
              "mt-1 text-xs font-semibold",
              dados.variacaoVsMesPassado >= 0 ? "text-verde-dark" : "text-erro",
            )}
          >
            Projeção deste mês está{" "}
            {dados.variacaoVsMesPassado >= 0
              ? `${dados.variacaoVsMesPassado}% acima`
              : `${Math.abs(dados.variacaoVsMesPassado)}% abaixo`}{" "}
            do mês passado
          </p>
        )}
      </div>
    </div>
  );
}

function CardMes({
  label,
  valor,
  cor,
}: {
  label: string;
  valor: string;
  cor: string;
}) {
  return (
    <div className="rounded-card border border-neutro-border bg-superficie p-3 text-center">
      <p className={cn("text-sm font-bold", cor)}>{valor}</p>
      <p className="mt-0.5 text-[10px] text-neutro-muted">{label}</p>
    </div>
  );
}
