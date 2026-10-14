"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { guardaNoCache, leDoCache, limpaCache } from "@/lib/cache-de-tela";
import { useEmpresa } from "@/hooks/useEmpresa";
import { dataDeHojeNoBrasil } from "@/lib/datas";
import type { Cliente } from "@/types";

/** Todos os clientes da empresa, ordenados por nome — busca/filtro ficam no client. */
export function useClientes() {
  const { empresa, loading: carregandoEmpresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  // Abre com o que já tinha e busca por trás — ver lib/cache-de-tela.ts.
  const chaveCache = `clientes:${empresa?.id ?? ""}`;
  const [clientes, setClientes] = useState<Cliente[]>(
    () => leDoCache<Cliente[]>(chaveCache) ?? [],
  );
  const [loading, setLoading] = useState(
    () => leDoCache<Cliente[]>(chaveCache) === undefined,
  );
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!empresa) return;
    if (leDoCache(chaveCache) === undefined) setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from("clientes")
      .select("*")
      .eq("empresa_id", empresa.id)
      .order("nome", { ascending: true });

    if (fetchError) {
      setError("Não foi possível carregar os clientes.");
      setLoading(false);
      return;
    }

    const lista = data ?? [];
    setClientes(lista);
    guardaNoCache(chaveCache, lista);
    setLoading(false);
  }, [empresa, supabase]);

  useEffect(() => {
    if (empresa) {
      carregar();
    } else if (!carregandoEmpresa) {
      setLoading(false);
    }
  }, [empresa, carregandoEmpresa, carregar]);

  /**
   * Apaga de verdade.
   *
   * ISTO NÃO EXISTIA, em lugar nenhum do app — nem aqui, nem na tela de
   * detalhe. Dava para criar e editar pessoa e nunca para remover, e a
   * reação dela foi exatamente essa: "e eu n posso APAGAR?? loucura isso".
   *
   * O que acontece com o histórico: `agendamentos.cliente_id` e
   * `transacoes.cliente_id` são `on delete set null` (ver as migrations
   * 20260804120200 e 20260804120400). Ou seja, apagar a pessoa NÃO apaga a
   * venda nem o agendamento — eles ficam, sem dono. É o comportamento certo
   * para um lançamento financeiro, que não pode desaparecer do caixa porque
   * alguém limpou um cadastro.
   *
   * Atualização otimista: a linha sai da tela no toque e volta se o banco
   * recusar. Numa lista que se limpa de dez em dez, esperar o servidor a cada
   * item é o que faz a pessoa desistir no meio.
   */
  const excluir = useCallback(
    async (id: string) => {
      if (!empresa) return false;
      const antes = clientes;
      setClientes((atual) => atual.filter((c) => c.id !== id));

      const { error: erro } = await supabase
        .from("clientes")
        .delete()
        .eq("id", id)
        .eq("empresa_id", empresa.id);

      if (erro) {
        setClientes(antes);
        return false;
      }
      limpaCache(chaveCache);
      return true;
    },
    [empresa, supabase, clientes, chaveCache],
  );

  /**
   * Cria uma pessoa com o mínimo: nome e, se houver, telefone.
   *
   * Vive AQUI e não na tela porque toda escrita precisa avisar o cache — a
   * lista de clientes é lida do cache por mais de uma tela, e o teste
   * testes/escrita-avisa-o-cache.test.ts cobra isso de cada arquivo que grava.
   * Com a escrita no hook, o cuidado existe num lugar só.
   */
  const adicionar = useCallback(
    async (nome: string, telefone?: string | null) => {
      if (!empresa) return false;
      const { error: erro } = await supabase.from("clientes").insert({
        empresa_id: empresa.id,
        nome,
        telefone: telefone?.trim() || null,
      });
      if (erro) return false;
      limpaCache(chaveCache);
      await carregar();
      return true;
    },
    [empresa, supabase, chaveCache, carregar],
  );

  /**
   * Marca que falou com a pessoa HOJE.
   *
   * É o gesto que ela repete o dia inteiro na ativação de base, e a data vem
   * de `dataDeHojeNoBrasil()` — nunca de `toISOString()`, que entre 21h e a
   * meia-noite daqui gravaria amanhã (ver lib/datas.ts).
   */
  const marcarContatoHoje = useCallback(
    async (id: string) => {
      if (!empresa) return false;
      const { error: erro } = await supabase
        .from("clientes")
        .update({ ultimo_atendimento: dataDeHojeNoBrasil() })
        .eq("id", id)
        .eq("empresa_id", empresa.id);
      if (erro) return false;
      limpaCache(chaveCache);
      await carregar();
      return true;
    },
    [empresa, supabase, chaveCache, carregar],
  );

  return {
    clientes,
    loading: carregandoEmpresa || loading,
    error,
    refetch: carregar,
    excluir,
    adicionar,
    marcarContatoHoje,
  };
}
