"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { janelaDeHoje } from "@/lib/datas";
import { useEmpresa } from "@/hooks/useEmpresa";
import {
  calcularFaturamentoPrevisto,
  calcularFaturamentoRealizado,
  calcularFaturamentoSemanal,
  calcularProgressoMeta,
  calcularResumoSemanal,
  calcularSaldoCaixa,
  calcularStatusNegocio,
  calcularTotalAPagar,
  calcularTotalAReceber,
  type DiaResumo,
  type StatusNegocio,
} from "@/lib/calculations";
import type { AgendamentoComCliente, Meta } from "@/types";

const INTERVALO_REVALIDACAO_MS = 30_000;

export interface DashboardData {
  faturamentoHoje: number;
  faturamentoMes: number;
  faturamentoPrevisto: number;
  saldoCaixa: number;
  progressoMeta: number;
  statusNegocio: StatusNegocio;
  meta: Meta | null;
  agendamentosHoje: AgendamentoComCliente[];
  totalAReceber: number;
  totalAPagar: number;
  resumoSemanal: DiaResumo[];
  faturamentoSemanaAtual: number;
  faturamentoSemanaPassada: number;
}

function inicioDaJanelaISO(): string {
  const agora = new Date();
  const inicioDoMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
  const catorzeDiasAtras = new Date(agora);
  catorzeDiasAtras.setDate(catorzeDiasAtras.getDate() - 13);
  catorzeDiasAtras.setHours(0, 0, 0, 0);

  const inicio =
    inicioDoMes < catorzeDiasAtras ? inicioDoMes : catorzeDiasAtras;
  return inicio.toISOString().slice(0, 10);
}

function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Agrega faturamento, saldo, agenda, alertas e resumo semanal em tempo real para o dashboard. */
export function useDashboard() {
  const { empresa, loading: carregandoEmpresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);
    setError(null);

    const agora = new Date();
    const hoje = hojeISO();

    const [transacoesResult, agendamentosResult, metaResult, clientesResult] =
      await Promise.all([
        supabase
          .from("transacoes")
          .select("*")
          .eq("empresa_id", empresa.id)
          .gte("data", inicioDaJanelaISO()),
        supabase
          .from("agendamentos")
          .select("*, cliente:clientes(*)")
          .eq("empresa_id", empresa.id)
          .gte("data_hora", janelaDeHoje().inicio)
          .lt("data_hora", janelaDeHoje().fim)
          .order("data_hora", { ascending: true }),
        supabase
          .from("metas")
          .select("*")
          .eq("empresa_id", empresa.id)
          .eq("mes", agora.getMonth() + 1)
          .eq("ano", agora.getFullYear())
          .maybeSingle(),
        supabase
          .from("clientes")
          .select("saldo_fiado")
          .eq("empresa_id", empresa.id),
      ]);

    if (
      transacoesResult.error ||
      agendamentosResult.error ||
      clientesResult.error
    ) {
      setError("Não foi possível carregar os dados do dashboard.");
      setLoading(false);
      return;
    }

    const transacoes = transacoesResult.data ?? [];
    const agendamentosHoje = (agendamentosResult.data ??
      []) as unknown as AgendamentoComCliente[];
    const meta = metaResult.data ?? null;
    const clientes = clientesResult.data ?? [];

    const faturamentoHoje = calcularFaturamentoRealizado(transacoes, "dia");
    const faturamentoMes = calcularFaturamentoRealizado(transacoes, "mes");
    const faturamentoPrevisto = calcularFaturamentoPrevisto(agendamentosHoje);
    const saldoCaixa = calcularSaldoCaixa(transacoes);
    const progressoMeta = calcularProgressoMeta(
      faturamentoMes,
      meta?.valor_meta ?? 0,
    );
    const statusNegocio = calcularStatusNegocio(progressoMeta);

    setDados({
      faturamentoHoje,
      faturamentoMes,
      faturamentoPrevisto,
      saldoCaixa,
      progressoMeta,
      statusNegocio,
      meta,
      agendamentosHoje,
      totalAReceber: calcularTotalAReceber(clientes),
      totalAPagar: calcularTotalAPagar(transacoes),
      resumoSemanal: calcularResumoSemanal(transacoes, agendamentosHoje),
      faturamentoSemanaAtual: calcularFaturamentoSemanal(transacoes, "atual"),
      faturamentoSemanaPassada: calcularFaturamentoSemanal(
        transacoes,
        "passada",
      ),
    });
    setLoading(false);
  }, [empresa, supabase]);

  useEffect(() => {
    if (empresa) {
      carregar();
    } else if (!carregandoEmpresa) {
      setLoading(false);
    }
  }, [empresa, carregandoEmpresa, carregar]);

  // Revalida a cada 30s e sempre que a aba volta a ficar em foco/visível —
  // dados financeiros mudam com frequência e não há realtime aqui ainda.
  useEffect(() => {
    if (!empresa) return;

    function revalidar() {
      carregar();
    }

    function aoMudarVisibilidade() {
      if (document.visibilityState === "visible") revalidar();
    }

    const intervalId = setInterval(revalidar, INTERVALO_REVALIDACAO_MS);
    window.addEventListener("focus", revalidar);
    document.addEventListener("visibilitychange", aoMudarVisibilidade);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", revalidar);
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
    };
  }, [empresa, carregar]);

  return {
    dados,
    loading: carregandoEmpresa || loading,
    error,
    refetch: carregar,
  };
}
