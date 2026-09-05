"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { guardaNoCache, leDoCache } from "@/lib/cache-de-tela";
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

  /*
   * A tela abre com o que ela já tinha, quando tinha.
   *
   * `loading` começa false se há algo guardado: o painel desenha na hora e a
   * busca segue por trás. É a diferença entre voltar para uma aba e ver os
   * seus números, ou ver dois segundos de retângulo cinza — que do lado de
   * fora parece o toque não ter pego. Ver lib/cache-de-tela.ts.
   */
  const chaveCache = `dashboard:${empresa?.id ?? ""}`;
  const [dados, setDados] = useState<DashboardData | null>(
    () => leDoCache<DashboardData>(chaveCache) ?? null,
  );
  const [loading, setLoading] = useState(
    () => leDoCache<DashboardData>(chaveCache) === undefined,
  );
  /*
   * Já existe algo desenhado na tela?
   *
   * É a pergunta que faltava, e a falta dela desfazia o cache logo acima. Ao
   * voltar para uma aba, o cache pintava os números na hora — e então o efeito
   * de montagem chamava `carregar()` sem ser silencioso, que punha `loading`
   * de volta em true e trocava os números por retângulo cinza até a resposta
   * chegar. O piscar não vinha da demora: vinha de a tela desistir do que já
   * tinha.
   *
   * Ref e não estado porque `carregar` precisa consultar o valor no momento em
   * que roda, sem ser recriado por causa dele — recriar mudaria a dependência
   * do efeito e faria a busca acontecer de novo.
   */
  const temAlgoNaTela = useRef(
    leDoCache<DashboardData>(chaveCache) !== undefined,
  );
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
  const carregar = useCallback(
    async (silencioso = false) => {
      if (!empresa) return;
      // Esqueleto só quando não há o que mostrar. Com algo na tela, a busca é
      // sempre uma revalidação — mesmo a primeira, vinda do cache.
      if (!silencioso && !temAlgoNaTela.current) setLoading(true);
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

      const montado: DashboardData = {
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
      };

      setDados(montado);
      temAlgoNaTela.current = true;
      guardaNoCache(chaveCache, montado);
      setLoading(false);
      // Depende do ID e não do OBJETO empresa: o provider pode entregar um objeto
      // novo com os mesmos dados (troca de token, revalidação), e comparar por
      // referência fazia o painel refazer todas as consultas à toa.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [empresa?.id, supabase],
  );

  /*
   * Dois efeitos, e não um, de propósito.
   *
   * Antes era um só, com `carregandoEmpresa` entre as dependências. Isso fazia
   * o painel buscar tudo DUAS vezes em todo carregamento: uma quando a empresa
   * chegava, e outra logo depois, quando a flag de carregamento virava falsa.
   * Oito consultas para mostrar os mesmos números.
   *
   * Buscar depende da empresa. A flag só diz quando parar de mostrar o
   * esqueleto para quem não tem empresa nenhuma. São perguntas diferentes.
   */
  useEffect(() => {
    if (empresa?.id) carregar();
  }, [empresa?.id, carregar]);

  useEffect(() => {
    if (!empresa && !carregandoEmpresa) setLoading(false);
  }, [empresa, carregandoEmpresa]);

  // Revalida a cada 30s e sempre que a aba volta a ficar em foco/visível —
  // dados financeiros mudam com frequência e não há realtime aqui ainda.
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
  }, [empresa?.id, carregar]);

  return {
    dados,
    loading: carregandoEmpresa || loading,
    error,
    refetch: carregar,
  };
}
