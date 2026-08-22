"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { paraISOLocal } from "@/lib/utils";
import type { AgendamentoComCliente, Transacao } from "@/types";

const INTERVALO_REVALIDACAO_MS = 60_000;

function janela() {
  const agora = new Date();
  const inicioMesPassado = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const fimMesAtual = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
  return {
    inicio: paraISOLocal(inicioMesPassado),
    fim: paraISOLocal(fimMesAtual),
  };
}

/**
 * Dados brutos (transações + agendamentos) do mês passado até o fim do mês
 * atual — janela única que cobre as 3 visões (hoje/semana/mês) e o
 * comparativo com o mês anterior, sem precisar refazer a busca ao trocar
 * de aba.
 */
export function useFaturamento() {
  const { empresa, loading: carregandoEmpresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [agendamentos, setAgendamentos] = useState<AgendamentoComCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*
   * `silencioso` separa a primeira carga da revalidação.
   *
   * Antes toda chamada fazia `setLoading(true)`, e a página troca o conteúdo
   * inteiro pelo esqueleto sempre que `loading` é verdadeiro. Como isso rodava
   * de novo a cada meio minuto, a tela virava esqueleto e voltava sozinha o
   * tempo todo. Quem estava usando descrevia como "a página recarrega": não
   * era recarga, mas para quem olha é a mesma coisa, e pior, acontece no meio
   * de uma leitura.
   *
   * Na revalidação os dados só são trocados quando chegam. Se falhar, o que
   * está na tela continua ali, que é melhor do que esvaziar a tela por causa
   * de uma atualização de fundo que ninguém pediu.
   */
  const carregar = useCallback(async (silencioso = false) => {
    if (!empresa) return;
    if (!silencioso) setLoading(true);
    setError(null);

    const { inicio, fim } = janela();

    const [transacoesResult, agendamentosResult] = await Promise.all([
      supabase
        .from("transacoes")
        .select("*")
        .eq("empresa_id", empresa.id)
        .gte("data", inicio)
        .lte("data", fim),
      supabase
        .from("agendamentos")
        .select("*, cliente:clientes(*)")
        .eq("empresa_id", empresa.id)
        .gte("data_hora", `${inicio}T00:00:00`)
        .lte("data_hora", `${fim}T23:59:59`)
        .order("data_hora", { ascending: true }),
    ]);

    if (transacoesResult.error || agendamentosResult.error) {
      setError("Não foi possível carregar o faturamento.");
      setLoading(false);
      return;
    }

    setTransacoes(transacoesResult.data ?? []);
    setAgendamentos(
      (agendamentosResult.data ?? []) as unknown as AgendamentoComCliente[],
    );
    setLoading(false);
  }, [empresa, supabase]);

  useEffect(() => {
    if (empresa) {
      carregar();
    } else if (!carregandoEmpresa) {
      setLoading(false);
    }
  }, [empresa, carregandoEmpresa, carregar]);

  useEffect(() => {
    if (!empresa) return;

    function revalidar() {
      carregar(true);
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
    transacoes,
    agendamentos,
    loading: carregandoEmpresa || loading,
    error,
    refetch: carregar,
  };
}
