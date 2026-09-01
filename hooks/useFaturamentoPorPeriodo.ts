"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { HISTORICO_EM_MESES } from "@/lib/planos";
import type { PlanoComAcesso } from "@/lib/planos";

/** Os quatro recortes da referência. */
export type Periodo = "1s" | "1m" | "6m" | "1a";

export const PERIODOS: { id: Periodo; label: string; meses: number }[] = [
  { id: "1s", label: "1s", meses: 1 },
  { id: "1m", label: "1m", meses: 1 },
  { id: "6m", label: "6m", meses: 6 },
  { id: "1a", label: "1a", meses: 12 },
];

export interface Barra {
  /** O que vai embaixo da barra: "S" para dia, "AGO" para mês. */
  rotulo: string;
  valor: number;
}

/** Uma linha de "Principais" — o equivalente aos estabelecimentos da referência. */
export interface Principal {
  nome: string;
  valor: number;
  vezes: number;
}

export interface ResumoDoPeriodo {
  barras: Barra[];
  /** O que mais faturou no período, do maior para o menor. */
  principais: Principal[];
  total: number;
  /** O mesmo recorte, um período atrás. Serve para o "X% vs período anterior". */
  totalAnterior: number;
  titulo: string;
}

const DIAS_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];
const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

/** Meia-noite local de N dias atrás, como texto `AAAA-MM-DD`. */
function diaTexto(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

/**
 * O faturamento num recorte de tempo, pronto para virar gráfico.
 *
 * A CONSULTA É POR PERÍODO, e não "traz tudo e filtra na tela": um ano de
 * transações de um negócio movimentado é muita linha para trafegar e guardar
 * na memória do celular só para desenhar doze barras.
 *
 * O teto do plano é respeitado AQUI, e não escondendo o botão: esconder o
 * "1a" da tela não impede nada, e a regra precisa valer no lugar onde os dados
 * são pedidos. O que a tela faz com `bloqueado` é oferecer o caminho para
 * liberar, em vez de mostrar um gráfico vazio que pareceria um negócio parado.
 */
export function useFaturamentoPorPeriodo(periodo: Periodo) {
  const { empresa, plano, loading: carregandoEmpresa } = useAuth();
  const [supabase] = useState(() => createClient());
  const [resumo, setResumo] = useState<ResumoDoPeriodo | null>(null);
  const [loading, setLoading] = useState(true);

  /*
   * `??` NÃO SERVE AQUI, e a razão é uma armadilha que custou um bug.
   *
   * Em HISTORICO_EM_MESES, `null` é um valor com significado: "sem limite" —
   * é o que os planos pagos têm. O operador `??` trata `null` como ausência,
   * então `HISTORICO_EM_MESES.pro ?? HISTORICO_EM_MESES.free` devolvia 1 mês.
   * Resultado: quem paga recebia o teto de histórico de quem não paga, e via
   * a mesma tela de "isso faz parte do plano pago" que já comprou.
   *
   * A pergunta certa é se o plano EXISTE na tabela, e não se o valor dele é
   * falsy. Plano desconhecido continua caindo no gratuito, que é a escolha
   * segura de sempre.
   */
  const planoConhecido = plano !== null && plano in HISTORICO_EM_MESES;
  const tetoEmMeses = planoConhecido
    ? HISTORICO_EM_MESES[plano as PlanoComAcesso]
    : HISTORICO_EM_MESES.free;
  const pedido = PERIODOS.find((p) => p.id === periodo)!;
  const bloqueado = tetoEmMeses !== null && pedido.meses > tetoEmMeses;

  const carregar = useCallback(async () => {
    if (!empresa || bloqueado) return;
    setLoading(true);

    const hoje = new Date();
    // O começo do recorte, e o começo do recorte ANTERIOR — os dois vêm na
    // mesma consulta, senão seriam duas idas ao banco para desenhar uma tela.
    const inicio = new Date(hoje);
    const inicioAnterior = new Date(hoje);

    if (periodo === "1s") {
      inicio.setDate(inicio.getDate() - 6);
      inicioAnterior.setDate(inicioAnterior.getDate() - 13);
    } else if (periodo === "1m") {
      inicio.setDate(1);
      inicioAnterior.setMonth(inicioAnterior.getMonth() - 1, 1);
    } else {
      const meses = pedido.meses;
      inicio.setMonth(inicio.getMonth() - (meses - 1), 1);
      inicioAnterior.setMonth(inicioAnterior.getMonth() - (meses * 2 - 1), 1);
    }

    const { data, error } = await supabase
      .from("transacoes")
      // `categoria` e `descricao` entram por causa dos "Principais": é por
      // eles que se agrupa. Vêm na MESMA consulta — pedir de novo só para
      // montar uma lista de quatro linhas seria uma segunda ida ao banco para
      // desenhar a mesma tela.
      .select("valor, data, tipo, categoria, descricao")
      .eq("empresa_id", empresa.id)
      .eq("tipo", "entrada")
      .gte("data", diaTexto(inicioAnterior))
      .lte("data", diaTexto(hoje));

    if (error) {
      setLoading(false);
      return;
    }

    const entradas = data ?? [];
    const inicioTexto = diaTexto(inicio);

    // Só o recorte atual entra nas barras; o anterior serve à comparação.
    const noRecorte = entradas.filter((t) => t.data >= inicioTexto);
    const noAnterior = entradas.filter((t) => t.data < inicioTexto);

    const soma = (linhas: typeof entradas) =>
      linhas.reduce((total, t) => total + Number(t.valor), 0);

    const porChave = new Map<string, number>();
    const chaves: { chave: string; rotulo: string }[] = [];

    if (periodo === "1s" || periodo === "1m") {
      const cursor = new Date(inicio);
      while (cursor <= hoje) {
        const chave = diaTexto(cursor);
        chaves.push({
          chave,
          rotulo:
            periodo === "1s"
              ? DIAS_SEMANA[cursor.getDay()]!
              : String(cursor.getDate()),
        });
        porChave.set(chave, 0);
        cursor.setDate(cursor.getDate() + 1);
      }
      for (const t of noRecorte) {
        porChave.set(t.data, (porChave.get(t.data) ?? 0) + Number(t.valor));
      }
    } else {
      const cursor = new Date(inicio);
      while (cursor <= hoje) {
        const chave = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
        chaves.push({ chave, rotulo: MESES[cursor.getMonth()]! });
        porChave.set(chave, 0);
        cursor.setMonth(cursor.getMonth() + 1);
      }
      for (const t of noRecorte) {
        const chave = t.data.slice(0, 7);
        if (porChave.has(chave)) {
          porChave.set(chave, (porChave.get(chave) ?? 0) + Number(t.valor));
        }
      }
    }

    /*
     * Agrupa por categoria, caindo na descrição quando não há categoria.
     *
     * A referência lista estabelecimentos porque lá o dado vem do cartão. Aqui
     * o que a dona escreve é a categoria da venda ou o que ela vendeu — é o
     * mesmo papel: "de onde veio o dinheiro deste período".
     */
    const porNome = new Map<string, { valor: number; vezes: number }>();
    for (const t of noRecorte) {
      const nome = (t.categoria || t.descricao || "Sem categoria").trim();
      const atual = porNome.get(nome) ?? { valor: 0, vezes: 0 };
      porNome.set(nome, {
        valor: atual.valor + Number(t.valor),
        vezes: atual.vezes + 1,
      });
    }

    setResumo({
      barras: chaves.map(({ chave, rotulo }) => ({
        rotulo,
        valor: porChave.get(chave) ?? 0,
      })),
      principais: [...porNome.entries()]
        .map(([nome, d]) => ({ nome, valor: d.valor, vezes: d.vezes }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 6),
      total: soma(noRecorte),
      totalAnterior: soma(noAnterior),
      titulo:
        periodo === "1s"
          ? "Faturamento na semana"
          : periodo === "1m"
            ? "Faturamento no mês"
            : `Faturamento em ${pedido.meses} meses`,
    });
    setLoading(false);
  }, [empresa, supabase, periodo, pedido.meses, bloqueado]);

  useEffect(() => {
    if (bloqueado) {
      setLoading(false);
      setResumo(null);
      return;
    }
    if (empresa) carregar();
    else if (!carregandoEmpresa) setLoading(false);
  }, [empresa, carregandoEmpresa, carregar, bloqueado]);

  return useMemo(
    () => ({ resumo, loading, bloqueado }),
    [resumo, loading, bloqueado],
  );
}
