"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { limpaCache } from "@/lib/cache-de-tela";
import { useEmpresa } from "@/hooks/useEmpresa";
import {
  calcularFaturamentoPorMes,
  calcularMelhorDiaDoMes,
  calcularProgressoMeta,
  calcularProjecaoMensal,
  calcularStatusNegocio,
  type MelhorDia,
  type StatusNegocio,
} from "@/lib/calculations";
import { calcularMetaDiaria } from "@/lib/formatters";
import { diasNoMesAtual } from "@/lib/utils";

export interface LinhaHistoricoMeta {
  mes: number;
  ano: number;
  meta: number | null;
  realizado: number;
}

export interface DadosMetas {
  metaMensal: number;
  realizadoMes: number;
  progressoMeta: number;
  statusNegocio: StatusNegocio;
  projecaoFechamento: number;
  metaDiaria: number;
  melhorDia: MelhorDia | null;
  realizadoMesAnterior: number;
  variacaoPercentual: number | null;
  historico: LinhaHistoricoMeta[];
}

function mesAnterior(ano: number, mes: number) {
  return mes === 1 ? { ano: ano - 1, mes: 12 } : { ano, mes: mes - 1 };
}

/** Progresso, projeção e histórico de metas — tudo calculado ao vivo a partir de `transacoes`. */
export function useMetas() {
  const { empresa, loading: carregandoEmpresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  const [dados, setDados] = useState<DadosMetas | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    setLoading(true);
    setError(null);

    const agora = new Date();
    const anoAtual = agora.getFullYear();
    const mesAtual = agora.getMonth() + 1;
    const seisMesesAtras = new Date(anoAtual, agora.getMonth() - 5, 1);

    const [transacoesResult, metasResult] = await Promise.all([
      supabase
        .from("transacoes")
        .select("*")
        .eq("empresa_id", empresa.id)
        .eq("tipo", "entrada")
        .gte("data", seisMesesAtras.toISOString().slice(0, 10)),
      supabase
        .from("metas")
        .select("mes, ano, valor_meta")
        .eq("empresa_id", empresa.id)
        .order("ano", { ascending: false })
        .order("mes", { ascending: false })
        .limit(12),
    ]);

    if (transacoesResult.error || metasResult.error) {
      setError("Não foi possível carregar os dados de metas.");
      setLoading(false);
      return;
    }

    const transacoes = transacoesResult.data ?? [];
    const metasPorChave = new Map(
      (metasResult.data ?? []).map((m) => [`${m.ano}-${m.mes}`, m.valor_meta]),
    );

    const metaMensal = empresa.meta_mensal ?? 0;
    const realizadoMes = calcularFaturamentoPorMes(
      transacoes,
      anoAtual,
      mesAtual,
    );
    const progressoMeta = calcularProgressoMeta(realizadoMes, metaMensal);
    const statusNegocio = calcularStatusNegocio(progressoMeta);
    const diasPassados = agora.getDate();
    const diasTotais = diasNoMesAtual();
    const projecaoFechamento = calcularProjecaoMensal(
      realizadoMes,
      diasPassados,
      diasTotais,
    );
    const metaDiaria = metaMensal > 0 ? calcularMetaDiaria(metaMensal) : 0;
    const melhorDia = calcularMelhorDiaDoMes(transacoes);

    const { ano: anoAnt, mes: mesAnt } = mesAnterior(anoAtual, mesAtual);
    const realizadoMesAnterior = calcularFaturamentoPorMes(
      transacoes,
      anoAnt,
      mesAnt,
    );
    const variacaoPercentual =
      realizadoMesAnterior > 0
        ? Number(
            (
              ((realizadoMes - realizadoMesAnterior) / realizadoMesAnterior) *
              100
            ).toFixed(1),
          )
        : realizadoMes > 0
          ? 100
          : null;

    const historico: LinhaHistoricoMeta[] = [];
    for (let i = 0; i < 6; i++) {
      const data = new Date(anoAtual, agora.getMonth() - i, 1);
      const mes = data.getMonth() + 1;
      const ano = data.getFullYear();
      const metaExistente = metasPorChave.get(`${ano}-${mes}`) ?? null;
      historico.push({
        mes,
        ano,
        meta:
          metaExistente ?? (i === 0 && metaMensal > 0 ? metaMensal : null),
        realizado: calcularFaturamentoPorMes(transacoes, ano, mes),
      });
    }

    // Garante um registro em `metas` para o mês atual, para o histórico
    // ficar consistente daqui pra frente (não sobrescreve meses passados).
    if (metaMensal > 0 && !metasPorChave.has(`${anoAtual}-${mesAtual}`)) {
      await supabase.from("metas").upsert(
        {
          empresa_id: empresa.id,
          mes: mesAtual,
          ano: anoAtual,
          valor_meta: metaMensal,
        },
        { onConflict: "empresa_id,mes,ano" },
      );
      // As listas guardadas ficaram velhas — ver lib/cache-de-tela.ts.
      limpaCache();
    }

    setDados({
      metaMensal,
      realizadoMes,
      progressoMeta,
      statusNegocio,
      projecaoFechamento,
      metaDiaria,
      melhorDia,
      realizadoMesAnterior,
      variacaoPercentual,
      historico,
    });
    setLoading(false);
  }, [empresa, supabase]);

  useEffect(() => {
    if (empresa) {
      carregar();
    } else if (!carregandoEmpresa) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa?.id, empresa?.meta_mensal, carregandoEmpresa]);

  const ajustarMeta = useCallback(
    async (novoValor: number) => {
      if (!empresa) return false;
      const agora = new Date();
      const novaMetaDiaria = novoValor > 0 ? calcularMetaDiaria(novoValor) : null;

      const { error: updateError } = await supabase
        .from("empresas")
        .update({
          meta_mensal: novoValor > 0 ? novoValor : null,
          meta_diaria: novaMetaDiaria,
        })
        .eq("id", empresa.id);
      // As listas guardadas ficaram velhas — ver lib/cache-de-tela.ts.
      limpaCache();

      if (updateError) return false;

      if (novoValor > 0) {
        await supabase.from("metas").upsert(
          {
            empresa_id: empresa.id,
            mes: agora.getMonth() + 1,
            ano: agora.getFullYear(),
            valor_meta: novoValor,
          },
          { onConflict: "empresa_id,mes,ano" },
        );
      // As listas guardadas ficaram velhas — ver lib/cache-de-tela.ts.
      limpaCache();
      }

      await carregar();
      return true;
    },
    [empresa, supabase, carregar],
  );

  return {
    dados,
    loading: carregandoEmpresa || loading,
    error,
    refetch: carregar,
    ajustarMeta,
  };
}
