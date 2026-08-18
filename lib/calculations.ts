import { paraISOLocal } from "@/lib/utils";
import { janelaDosUltimosDias } from "@/lib/datas";
import type { Agendamento, Cliente, Produto, Transacao } from "@/types";

function inicioDoPeriodo(periodo: "dia" | "semana" | "mes"): Date {
  const inicio = new Date();

  if (periodo === "dia") {
    inicio.setHours(0, 0, 0, 0);
  } else if (periodo === "semana") {
    inicio.setDate(inicio.getDate() - inicio.getDay());
    inicio.setHours(0, 0, 0, 0);
  } else {
    inicio.setDate(1);
    inicio.setHours(0, 0, 0, 0);
  }

  return inicio;
}

/**
 * Faturamento previsto = agendamentos com status "confirmado" ou "pendente",
 * valor_previsto > 0 e data ainda no futuro (a partir de agora). Concluir um
 * agendamento (status vira "concluido") ou marcar não compareceu tiram o
 * valor daqui automaticamente — não precisa de nenhuma lógica extra além
 * desse filtro.
 */
export function calcularFaturamentoPrevisto(
  agendamentos: Agendamento[],
): number {
  const agora = new Date();
  return agendamentos
    .filter(
      (a) =>
        (a.status === "confirmado" || a.status === "pendente") &&
        Number(a.valor_previsto ?? 0) > 0 &&
        new Date(a.data_hora) >= agora,
    )
    .reduce((total, a) => total + Number(a.valor_previsto ?? 0), 0);
}

/** Soma as entradas (tipo "entrada") dentro do período informado. */
export function calcularFaturamentoRealizado(
  transacoes: Transacao[],
  periodo: "dia" | "semana" | "mes",
): number {
  const inicio = inicioDoPeriodo(periodo);

  return transacoes
    .filter(
      (t) => t.tipo === "entrada" && new Date(`${t.data}T00:00:00`) >= inicio,
    )
    .reduce((total, t) => total + Number(t.valor), 0);
}

/** Entradas menos saídas, para o conjunto de transações informado. */
export function calcularSaldoCaixa(transacoes: Transacao[]): number {
  return transacoes.reduce((saldo, t) => {
    const valor = Number(t.valor);
    return t.tipo === "entrada" ? saldo + valor : saldo - valor;
  }, 0);
}

/** % da meta batido até agora (pode passar de 100 — dia de recorde). */
export function calcularProgressoMeta(realizado: number, meta: number): number {
  if (meta <= 0) return 0;
  return Number(((realizado / meta) * 100).toFixed(1));
}

export type StatusNegocio = "otimo" | "atencao" | "prejuizo" | "recorde";

/**
 * Classifica o desempenho a partir do % da meta batido. Os cortes
 * (30/70/100) são uma escolha de produto — não havia limites definidos no
 * pedido original; ajuste aqui se o time de produto definir outros.
 */
export function calcularStatusNegocio(progressoMeta: number): StatusNegocio {
  if (progressoMeta >= 100) return "recorde";
  if (progressoMeta >= 70) return "otimo";
  if (progressoMeta >= 30) return "atencao";
  return "prejuizo";
}

/**
 * Mesma regra da trigger `atualizar_cliente_fiel`
 * (supabase/migrations/20260804120200_clientes.sql) — útil para checar no
 * cliente antes de um round-trip ao banco.
 */
export function calcularClienteFiel(cliente: Cliente): boolean {
  return cliente.total_visitas > 10 || cliente.total_gasto > 1000;
}

/** Média de dias entre agendamentos concluídos, mais antigo → mais recente. */
export function calcularFrequenciaMedia(agendamentos: Agendamento[]): number {
  const concluidos = agendamentos
    .filter((a) => a.status === "concluido")
    .map((a) => new Date(a.data_hora).getTime())
    .sort((a, b) => a - b);

  if (concluidos.length < 2) return 0;

  const intervalos: number[] = [];
  for (let i = 1; i < concluidos.length; i++) {
    const diasEntre =
      (concluidos[i]! - concluidos[i - 1]!) / (1000 * 60 * 60 * 24);
    intervalos.push(diasEntre);
  }

  const media =
    intervalos.reduce((soma, dias) => soma + dias, 0) / intervalos.length;
  return Number(media.toFixed(1));
}

/**
 * "A receber" no dashboard = saldo de fiado dos clientes (conta corrente,
 * distinto do "previsto" de hoje, que vem de agendamentos).
 */
export function calcularTotalAReceber(
  clientes: Pick<Cliente, "saldo_fiado">[],
): number {
  return clientes.reduce((total, c) => total + Number(c.saldo_fiado), 0);
}

/**
 * "A pagar" = saídas já lançadas com data de hoje em diante — o schema não
 * tem uma tabela dedicada de contas a pagar, então tratamos uma saída datada
 * no futuro como uma conta agendada/pendente.
 */
export function calcularTotalAPagar(transacoes: Transacao[]): number {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return transacoes
    .filter(
      (t) => t.tipo === "saida" && new Date(`${t.data}T00:00:00`) >= hoje,
    )
    .reduce((total, t) => total + Number(t.valor), 0);
}

/**
 * Faturamento (entradas) dos últimos 7 dias, ou dos 7 anteriores a esses.
 *
 * Era semana de CALENDÁRIO, começando no domingo, enquanto o gráfico ao lado
 * mostra os últimos 7 dias corridos. Os dois nunca batiam, e no domingo ficava
 * escancarado: as barras mostravam a semana cheia e o total mostrava só o dia,
 * com um "-89% vs semana passada" que não queria dizer nada.
 *
 * O total agora mede exatamente o período das barras. Quem lê um número ao pé
 * de um gráfico espera que ele seja a soma do gráfico, e essa expectativa é
 * mais forte do que qualquer definição de semana.
 */
export function calcularFaturamentoSemanal(
  transacoes: Transacao[],
  semana: "atual" | "passada",
): number {
  const { inicio: inicioRecente } = janelaDosUltimosDias(7);
  const inicio = new Date(inicioRecente);
  if (semana === "passada") inicio.setDate(inicio.getDate() - 7);

  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 7);

  return transacoes
    .filter((t) => {
      const data = new Date(`${t.data}T00:00:00`);
      return t.tipo === "entrada" && data >= inicio && data < fim;
    })
    .reduce((total, t) => total + Number(t.valor), 0);
}

export interface DiaResumo {
  data: string;
  realizado: number;
  previsto: number;
}

/**
 * Realizado dos últimos 7 dias (mais antigo → hoje). "Previsto" só existe
 * para o dia de hoje (agendamentos não pagos) — dias passados já aconteceram,
 * não faz sentido ter previsão para eles.
 */
export function calcularResumoSemanal(
  transacoes: Transacao[],
  agendamentosHoje: Agendamento[],
): DiaResumo[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dias: DiaResumo[] = [];

  for (let i = 6; i >= 0; i--) {
    const dia = new Date(hoje);
    dia.setDate(dia.getDate() - i);
    const proximoDia = new Date(dia);
    proximoDia.setDate(proximoDia.getDate() + 1);

    const iso = paraISOLocal(dia);

    const realizado = transacoes
      .filter((t) => {
        const data = new Date(`${t.data}T00:00:00`);
        return t.tipo === "entrada" && data >= dia && data < proximoDia;
      })
      .reduce((total, t) => total + Number(t.valor), 0);

    const previsto = i === 0 ? calcularFaturamentoPrevisto(agendamentosHoje) : 0;

    dias.push({ data: iso, realizado, previsto });
  }

  return dias;
}

/**
 * Projeta o fechamento do mês a partir do ritmo atual:
 * (realizado até agora / dias já passados) * dias totais do mês.
 */
export function calcularProjecaoMensal(
  realizadoMes: number,
  diasPassados: number,
  diasTotaisMes: number,
): number {
  if (diasPassados <= 0) return 0;
  return (realizadoMes / diasPassados) * diasTotaisMes;
}

/** Saídas marcadas como pendentes cujo vencimento já passou. */
export function calcularContasVencidas(transacoes: Transacao[]): Transacao[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return transacoes.filter(
    (t) =>
      t.tipo === "saida" &&
      t.status_pagamento === "pendente" &&
      t.data_vencimento !== null &&
      new Date(`${t.data_vencimento}T00:00:00`) < hoje,
  );
}

/** Maior faturamento (entradas) somado num único dia, opcionalmente ignorando uma data. */
export function calcularMelhorDiaHistorico(
  transacoes: Transacao[],
  ignorarData?: string,
): number {
  const porDia = new Map<string, number>();

  for (const t of transacoes) {
    if (t.tipo !== "entrada" || t.data === ignorarData) continue;
    porDia.set(t.data, (porDia.get(t.data) ?? 0) + Number(t.valor));
  }

  return porDia.size === 0 ? 0 : Math.max(...porDia.values());
}

export interface CategoriaDespesa {
  categoria: string;
  valor: number;
}

/** Top N categorias de saída do mês corrente, por valor total (desc). */
export function calcularTopCategoriasDespesa(
  transacoes: Transacao[],
  limite = 5,
): CategoriaDespesa[] {
  const inicioMes = inicioDoPeriodo("mes");

  const porCategoria = new Map<string, number>();
  for (const t of transacoes) {
    if (t.tipo !== "saida") continue;
    if (new Date(`${t.data}T00:00:00`) < inicioMes) continue;
    const categoria = t.categoria ?? "Outro";
    porCategoria.set(
      categoria,
      (porCategoria.get(categoria) ?? 0) + Number(t.valor),
    );
  }

  return Array.from(porCategoria.entries())
    .map(([categoria, valor]) => ({ categoria, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limite);
}

/** Soma das entradas de um mês/ano específico (não necessariamente o atual). */
export function calcularFaturamentoPorMes(
  transacoes: Transacao[],
  ano: number,
  mes: number,
): number {
  return transacoes
    .filter((t) => {
      if (t.tipo !== "entrada") return false;
      const data = new Date(`${t.data}T00:00:00`);
      return data.getFullYear() === ano && data.getMonth() + 1 === mes;
    })
    .reduce((total, t) => total + Number(t.valor), 0);
}

export interface MelhorDia {
  data: string;
  valor: number;
}

/** Dia com maior faturamento (entradas) dentro do mês corrente. */
export function calcularMelhorDiaDoMes(transacoes: Transacao[]): MelhorDia | null {
  const inicioMes = inicioDoPeriodo("mes");

  const porDia = new Map<string, number>();
  for (const t of transacoes) {
    if (t.tipo !== "entrada") continue;
    if (new Date(`${t.data}T00:00:00`) < inicioMes) continue;
    porDia.set(t.data, (porDia.get(t.data) ?? 0) + Number(t.valor));
  }

  let melhor: MelhorDia | null = null;
  for (const [data, valor] of porDia) {
    if (!melhor || valor > melhor.valor) {
      melhor = { data, valor };
    }
  }
  return melhor;
}

/** Estoque no ou abaixo do mínimo — mínimo 0 significa "sem alerta configurado". */
export function produtoAbaixoDoMinimo(
  produto: Pick<Produto, "quantidade_estoque" | "quantidade_minima">,
): boolean {
  return (
    produto.quantidade_minima > 0 &&
    produto.quantidade_estoque <= produto.quantidade_minima
  );
}

/** Dias corridos entre uma data ("YYYY-MM-DD") e hoje; null se a data for null. */
export function calcularDiasDesde(data: string | null): number | null {
  if (!data) return null;

  const alvo = new Date(`${data}T00:00:00`);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return Math.round((hoje.getTime() - alvo.getTime()) / (1000 * 60 * 60 * 24));
}
