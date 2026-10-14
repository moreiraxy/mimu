"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { guardaNoCache, leDoCache, limpaCache } from "@/lib/cache-de-tela";
import { useEmpresa } from "@/hooks/useEmpresa";
import { dataDeHojeNoBrasil } from "@/lib/datas";
import { estadoDaRotina, type EstadoDaRotina } from "@/lib/posto/rotina";
import { resumirDinheiro, type ResumoDoDinheiro } from "@/lib/posto/financas";
import type { Transacao } from "@/types";
import type {
  Database,
  FrentePosto,
  TipoPendencia,
} from "@/types/database";

type Pendencia = Database["public"]["Tables"]["posto_pendencias"]["Row"];

export interface NovaPendencia {
  titulo: string;
  frente: FrentePosto;
  tipo: TipoPendencia;
  comQuem?: string | null;
  prazo?: string | null;
  urgente?: boolean;
  detalhe?: string | null;
}

export interface DadosDoPosto {
  rotina: EstadoDaRotina;
  pendencias: Pendencia[];
  numeros: Record<string, number>;
  dinheiroDoMes: ResumoDoDinheiro;
  resumoDoDia: { texto: string; enviadoEm: string | null } | null;
}

/**
 * Tudo que o Posto de Comando precisa, numa ida só ao banco por tabela.
 *
 * O DIA É O DE BRASÍLIA, e isso é a decisão que mais importa aqui. `dia` é
 * sempre `dataDeHojeNoBrasil()`, nunca `toISOString().slice(0,10)`: o segundo
 * devolve AMANHÃ entre 21h e a meia-noite daqui, e o efeito seria a rotina
 * virar de dia às 21h, apagando da tela o que ela acabou de marcar. É o mesmo
 * defeito corrigido em lib/mimu/registro.ts em 10/09/2026.
 *
 * O relógio fica no estado e avança de minuto em minuto. Sem isso, o "bloco de
 * agora" congelaria no instante em que a tela abriu — e essa tela fica aberta
 * o dia inteiro, que é justamente o uso para o qual ela existe.
 */
export function usePosto() {
  const { empresa, loading: carregandoEmpresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  const [agora, setAgora] = useState(() => new Date());
  const hoje = dataDeHojeNoBrasil(agora);

  const chaveCache = `posto:${empresa?.id ?? ""}:${hoje}`;
  const [bruto, setBruto] = useState<{
    blocosFeitos: string[];
    pendencias: Pendencia[];
    numeros: Record<string, number>;
    transacoesDoMes: Transacao[];
    resumo: { texto: string; enviadoEm: string | null } | null;
  }>(
    () =>
      leDoCache(chaveCache) ?? {
        blocosFeitos: [],
        pendencias: [],
        numeros: {},
        transacoesDoMes: [],
        resumo: null,
      },
  );
  const [loading, setLoading] = useState(
    () => leDoCache(chaveCache) === undefined,
  );
  const [error, setError] = useState<string | null>(null);

  // Um minuto é a granularidade da rotina: todos os blocos começam em minuto
  // cheio, então acordar mais vezes só gastaria bateria.
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    if (leDoCache(chaveCache) === undefined) setLoading(true);
    setError(null);

    const primeiroDiaDoMes = `${hoje.slice(0, 7)}-01`;

    const [feitas, pendentes, numeros, transacoes, resumo] = await Promise.all([
      supabase
        .from("posto_rotina_feita")
        .select("bloco")
        .eq("empresa_id", empresa.id)
        .eq("dia", hoje),
      supabase
        .from("posto_pendencias")
        .select("*")
        .eq("empresa_id", empresa.id)
        .eq("status", "aberta")
        // Urgente primeiro, depois prazo mais perto. `nullsFirst: false` manda
        // o que não tem prazo para o fim: sem isso o Postgres ordena nulo por
        // último só em ASC por acidente, e a lista mudaria de ordem sozinha.
        .order("urgente", { ascending: false })
        .order("prazo", { ascending: true, nullsFirst: false })
        .order("criada_em", { ascending: true }),
      supabase
        .from("posto_numeros")
        .select("chave, valor")
        .eq("empresa_id", empresa.id)
        .eq("dia", hoje),
      supabase
        .from("transacoes")
        .select("*")
        .eq("empresa_id", empresa.id)
        .gte("data", primeiroDiaDoMes),
      supabase
        .from("posto_resumos")
        .select("texto, enviado_em")
        .eq("empresa_id", empresa.id)
        .eq("dia", hoje)
        .maybeSingle(),
    ]);

    if (feitas.error || pendentes.error || numeros.error || transacoes.error) {
      setError("Não consegui carregar o seu dia.");
      setLoading(false);
      return;
    }

    const dados = {
      blocosFeitos: (feitas.data ?? []).map((l) => l.bloco),
      pendencias: (pendentes.data ?? []) as Pendencia[],
      numeros: Object.fromEntries(
        (numeros.data ?? []).map((l) => [l.chave, Number(l.valor)]),
      ),
      transacoesDoMes: (transacoes.data ?? []) as unknown as Transacao[],
      resumo: resumo.data
        ? { texto: resumo.data.texto, enviadoEm: resumo.data.enviado_em }
        : null,
    };

    setBruto(dados);
    guardaNoCache(chaveCache, dados);
    setLoading(false);
  }, [empresa, supabase, chaveCache, hoje]);

  useEffect(() => {
    if (empresa) {
      carregar();
    } else if (!carregandoEmpresa) {
      setLoading(false);
    }
  }, [empresa, carregandoEmpresa, carregar]);

  const dados: DadosDoPosto = useMemo(
    () => ({
      rotina: estadoDaRotina(bruto.blocosFeitos, agora),
      pendencias: bruto.pendencias,
      numeros: bruto.numeros,
      dinheiroDoMes: resumirDinheiro(bruto.transacoesDoMes),
      resumoDoDia: bruto.resumo,
    }),
    [bruto, agora],
  );

  /**
   * Marcar e desmarcar bloco são otimistas: a tela responde no toque e o banco
   * confirma atrás. Numa tela que ela vai tocar dez vezes por dia, esperar o
   * servidor a cada toque é o que faz a pessoa desistir de marcar — e rotina
   * sem marcação não serve para nada.
   */
  const marcarBloco = useCallback(
    async (bloco: string, feito: boolean) => {
      if (!empresa) return false;
      setBruto((atual) => ({
        ...atual,
        blocosFeitos: feito
          ? [...atual.blocosFeitos, bloco]
          : atual.blocosFeitos.filter((b) => b !== bloco),
      }));

      const { error: erro } = feito
        ? await supabase
            .from("posto_rotina_feita")
            .upsert(
              { empresa_id: empresa.id, dia: hoje, bloco },
              { onConflict: "empresa_id,dia,bloco" },
            )
        : await supabase
            .from("posto_rotina_feita")
            .delete()
            .eq("empresa_id", empresa.id)
            .eq("dia", hoje)
            .eq("bloco", bloco);

      if (erro) {
        // Volta ao que era: deixar marcado o que o banco não aceitou faria a
        // tela mentir até o próximo recarregamento.
        setBruto((atual) => ({
          ...atual,
          blocosFeitos: feito
            ? atual.blocosFeitos.filter((b) => b !== bloco)
            : [...atual.blocosFeitos, bloco],
        }));
        return false;
      }
      limpaCache(chaveCache);
      carregar();
      return true;
    },
    [empresa, supabase, hoje, carregar],
  );

  const criarPendencia = useCallback(
    async (nova: NovaPendencia) => {
      if (!empresa) return false;
      const { error: erro } = await supabase.from("posto_pendencias").insert({
        empresa_id: empresa.id,
        titulo: nova.titulo,
        frente: nova.frente,
        tipo: nova.tipo,
        com_quem: nova.comQuem ?? null,
        prazo: nova.prazo ?? null,
        urgente: nova.urgente ?? false,
        detalhe: nova.detalhe ?? null,
      });
      if (erro) return false;
      limpaCache(chaveCache);
      await carregar();
      return true;
    },
    [empresa, supabase, carregar, chaveCache],
  );

  const fecharPendencia = useCallback(
    async (id: string, status: "feita" | "descartada" = "feita") => {
      if (!empresa) return false;
      setBruto((atual) => ({
        ...atual,
        pendencias: atual.pendencias.filter((p) => p.id !== id),
      }));
      const { error: erro } = await supabase
        .from("posto_pendencias")
        .update({ status, concluida_em: new Date().toISOString() })
        .eq("id", id)
        .eq("empresa_id", empresa.id);
      if (erro) {
        await carregar();
        return false;
      }
      limpaCache(chaveCache);
      return true;
    },
    [empresa, supabase, carregar, chaveCache],
  );

  const anotarNumero = useCallback(
    async (chave: string, valor: number) => {
      if (!empresa) return false;
      setBruto((atual) => ({
        ...atual,
        numeros: { ...atual.numeros, [chave]: valor },
      }));
      const { error: erro } = await supabase.from("posto_numeros").upsert(
        { empresa_id: empresa.id, dia: hoje, chave, valor },
        { onConflict: "empresa_id,dia,chave" },
      );
      if (erro) {
        await carregar();
        return false;
      }
      limpaCache(chaveCache);
      return true;
    },
    [empresa, supabase, hoje, carregar, chaveCache],
  );

  const salvarResumo = useCallback(
    async (texto: string, enviado: boolean) => {
      if (!empresa) return false;
      const { error: erro } = await supabase.from("posto_resumos").upsert(
        {
          empresa_id: empresa.id,
          dia: hoje,
          texto,
          enviado_em: enviado ? new Date().toISOString() : null,
        },
        { onConflict: "empresa_id,dia" },
      );
      if (erro) return false;
      limpaCache(chaveCache);
      await carregar();
      return true;
    },
    [empresa, supabase, hoje, carregar, chaveCache],
  );

  return {
    dados,
    loading: loading || carregandoEmpresa,
    error,
    agora,
    hoje,
    recarregar: carregar,
    marcarBloco,
    criarPendencia,
    fecharPendencia,
    anotarNumero,
    salvarResumo,
  };
}
