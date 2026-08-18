import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildAlertaMessage,
  urlParaAlerta,
  type AlertaMetadata,
} from "@/lib/mimu-prompts";
import { enviarPushParaEmpresa } from "@/lib/push";
import { janelaDeHoje } from "@/lib/datas";
import { registrarEvento } from "@/lib/eventos";
import {
  calcularContasVencidas,
  calcularDiasDesde,
  calcularFaturamentoRealizado,
  calcularFaturamentoSemanal,
  calcularMelhorDiaHistorico,
  calcularProgressoMeta,
  produtoAbaixoDoMinimo,
} from "@/lib/calculations";
import { formatCurrency } from "@/lib/formatters";
import { lerConfigAlertas } from "@/lib/config-alertas";
import { diasNoMesAtual } from "@/lib/utils";
import type { Database, Json } from "@/types/database";
import type { AlertaMimu, Empresa, TipoAlerta } from "@/types";

/**
 * Alertas proativos da Mimu, fora de qualquer rota.
 *
 * Vivem aqui porque a mesma rotina roda em dois lugares muito diferentes: com
 * a sessão de quem abriu o app (/api/mimu/proativo) e sem sessão nenhuma, na
 * tarefa diária que varre todas as contas (/api/cron/alertas-diarios).
 * Duplicar isso garantiria que uma das duas ficasse para trás na primeira
 * mudança.
 */

type Supabase = SupabaseClient<Database>;

interface CandidatoAlerta {
  tipo: TipoAlerta;
  mensagem: string;
  metadata: AlertaMetadata | null;
  chaveDedupe: string;
}

/**
 * Roda as 6 checagens de alerta proativo da Mimu contra os dados reais do
 * negócio e devolve só o que ainda não foi alertado hoje. Chamada ao
 * carregar o dashboard, a cada 30min de app aberto, ao focar a aba, e logo
 * depois de registrar uma venda (para o alerta de recorde).
 */
async function checkAlertas(
  supabase: Supabase,
  empresa: Empresa,
): Promise<CandidatoAlerta[]> {
  const agora = new Date();
  const hojeISO = agora.toISOString().slice(0, 10);
  const inicioHoje = new Date(agora);
  inicioHoje.setHours(0, 0, 0, 0);

  const estoqueAtivo = empresa.modulos_ativos.includes("estoque");

  const [
    transacoesResult,
    agendamentosHojeResult,
    clientesFieisResult,
    alertasHojeResult,
    produtosResult,
  ] = await Promise.all([
    supabase.from("transacoes").select("*").eq("empresa_id", empresa.id),
    supabase
      .from("agendamentos")
      .select("id, status")
      .eq("empresa_id", empresa.id)
      .gte("data_hora", janelaDeHoje().inicio)
      .lt("data_hora", janelaDeHoje().fim),
    supabase
      .from("clientes")
      .select("id, nome, cliente_fiel, ultimo_atendimento, frequencia_media_dias")
      .eq("empresa_id", empresa.id)
      .eq("cliente_fiel", true),
    supabase
      .from("alertas_mimu")
      .select("tipo, metadata")
      .eq("empresa_id", empresa.id)
      .gte("created_at", inicioHoje.toISOString()),
    estoqueAtivo
      ? supabase
          .from("produtos")
          .select("id, nome, quantidade_estoque, quantidade_minima")
          .eq("empresa_id", empresa.id)
          .eq("ativo", true)
      : Promise.resolve({ data: [], error: null }),
  ]);

  /*
   * Falhou alguma consulta: não há como decidir alerta com dado incompleto,
   * então a varredura desta conta para aqui.
   *
   * Mas para COM RASTRO. Antes era um `return []` mudo: se uma das cinco
   * passasse a falhar, a conta simplesmente deixava de receber aviso e nada
   * indicava o motivo. O nome da consulta vai no registro porque "falhou uma
   * das cinco" não ajuda ninguém a consertar.
   */
  const falhas = Object.entries({
    transacoes: transacoesResult.error,
    agendamentos: agendamentosHojeResult.error,
    clientes: clientesFieisResult.error,
    alertas: alertasHojeResult.error,
    produtos: produtosResult.error,
  }).filter(([, erro]) => erro);

  if (falhas.length > 0) {
    console.error("Alertas: consulta falhou, conta pulada.", {
      empresaId: empresa.id,
      falhas: falhas.map(([nome, erro]) => `${nome}: ${erro?.message}`),
    });
    await registrarEvento("alertas_falharam", {
      empresaId: empresa.id,
      detalhe: {
        motivo: falhas.map(([nome, erro]) => `${nome}: ${erro?.message}`).join(" | "),
      },
    });
    return [];
  }

  const transacoes = transacoesResult.data ?? [];
  const agendamentosHoje = agendamentosHojeResult.data ?? [];
  const clientesFieis = clientesFieisResult.data ?? [];
  const alertasHoje = alertasHojeResult.data ?? [];
  const produtos = produtosResult.data ?? [];

  // Chaves já alertadas hoje — genéricas por tipo, ou por transação/cliente
  // nos alertas que podem se repetir (conta vencida, cliente sumido).
  const jaAlertadoHoje = new Set(
    alertasHoje.map((a) => {
      const meta = (a.metadata ?? {}) as AlertaMetadata;
      if (a.tipo === "conta_vencida" && meta.transacaoId) {
        return `conta_vencida:${meta.transacaoId}`;
      }
      if (a.tipo === "cliente_sumiu" && meta.clienteId) {
        return `cliente_sumiu:${meta.clienteId}`;
      }
      if (a.tipo === "estoque_baixo" && meta.produtoId) {
        return `estoque_baixo:${meta.produtoId}`;
      }
      return a.tipo;
    }),
  );

  const candidatos: CandidatoAlerta[] = [];
  const configAlertas = lerConfigAlertas(empresa.config_alertas);

  // 1. Sem venda no dia (padrão 17h, configurável em Minha Empresa)
  if (
    configAlertas.sem_venda.ativo &&
    agora.getHours() >= configAlertas.sem_venda.hora &&
    !jaAlertadoHoje.has("sem_venda")
  ) {
    const faturamentoHoje = calcularFaturamentoRealizado(transacoes, "dia");
    if (faturamentoHoje === 0) {
      candidatos.push({
        tipo: "sem_venda",
        mensagem: buildAlertaMessage("sem_venda"),
        metadata: null,
        chaveDedupe: "sem_venda",
      });
    }
  }

  // 2. Agendamentos sem conclusão (padrão 19h, configurável em Minha Empresa)
  if (
    configAlertas.agendamento_pendente.ativo &&
    agora.getHours() >= configAlertas.agendamento_pendente.hora &&
    !jaAlertadoHoje.has("agendamento_pendente")
  ) {
    const naoConcluidos = agendamentosHoje.filter(
      (a) => a.status === "confirmado" || a.status === "pendente",
    );
    if (naoConcluidos.length > 0) {
      candidatos.push({
        tipo: "agendamento_pendente",
        mensagem: buildAlertaMessage("agendamento_pendente", {
          quantidade: naoConcluidos.length,
        }),
        metadata: null,
        chaveDedupe: "agendamento_pendente",
      });
    }
  }

  // 3. Conta vencida (qualquer horário) — um alerta por conta em aberto
  for (const conta of calcularContasVencidas(transacoes)) {
    const chave = `conta_vencida:${conta.id}`;
    if (jaAlertadoHoje.has(chave)) continue;
    candidatos.push({
      tipo: "conta_vencida",
      mensagem: buildAlertaMessage("conta_vencida", {
        valor: formatCurrency(Number(conta.valor)),
      }),
      metadata: { transacaoId: conta.id },
      chaveDedupe: chave,
    });
  }

  // 4. Meta em risco (segunda de manhã)
  if (
    agora.getDay() === 1 &&
    agora.getHours() < 12 &&
    !jaAlertadoHoje.has("meta_risco") &&
    empresa.meta_mensal
  ) {
    const faturamentoSemanaPassada = calcularFaturamentoSemanal(
      transacoes,
      "passada",
    );
    const metaSemanal = empresa.meta_mensal / (diasNoMesAtual() / 7);
    const progresso = calcularProgressoMeta(
      faturamentoSemanaPassada,
      metaSemanal,
    );
    if (progresso < 70) {
      candidatos.push({
        tipo: "meta_risco",
        mensagem: buildAlertaMessage("meta_risco", {
          faturamentoSemanaPassada: formatCurrency(faturamentoSemanaPassada),
          valorNecessario: formatCurrency(metaSemanal),
        }),
        metadata: null,
        chaveDedupe: "meta_risco",
      });
    }
  }

  // 5. Recorde batido — sem janela de horário; dispara na prática logo após
  // registrar uma venda, porque o cliente chama essa rota nesse momento.
  if (!jaAlertadoHoje.has("recorde")) {
    const faturamentoHoje = calcularFaturamentoRealizado(transacoes, "dia");
    const melhorDiaAnterior = calcularMelhorDiaHistorico(transacoes, hojeISO);
    if (faturamentoHoje > 0 && faturamentoHoje > melhorDiaAnterior) {
      candidatos.push({
        tipo: "recorde",
        mensagem: buildAlertaMessage("recorde", {
          valor: formatCurrency(faturamentoHoje),
        }),
        metadata: null,
        chaveDedupe: "recorde",
      });
    }
  }

  // 6. Cliente fiel sem aparecer
  for (const cliente of clientesFieis) {
    if (!cliente.frequencia_media_dias || cliente.frequencia_media_dias <= 0) {
      continue;
    }
    const chave = `cliente_sumiu:${cliente.id}`;
    if (jaAlertadoHoje.has(chave)) continue;

    const dias = calcularDiasDesde(cliente.ultimo_atendimento);
    if (dias !== null && dias > cliente.frequencia_media_dias * 2) {
      candidatos.push({
        tipo: "cliente_sumiu",
        mensagem: buildAlertaMessage("cliente_sumiu", {
          nome: cliente.nome,
          dias: Math.round(cliente.frequencia_media_dias),
        }),
        metadata: { clienteId: cliente.id },
        chaveDedupe: chave,
      });
    }
  }

  // 7. Estoque baixo (só quando o módulo Produtos e Estoque está ativo)
  for (const produto of produtos) {
    if (!produtoAbaixoDoMinimo(produto)) continue;
    const chave = `estoque_baixo:${produto.id}`;
    if (jaAlertadoHoje.has(chave)) continue;
    candidatos.push({
      tipo: "estoque_baixo",
      mensagem: buildAlertaMessage("estoque_baixo", {
        nome: produto.nome,
        quantidade: produto.quantidade_estoque,
      }),
      metadata: { produtoId: produto.id },
      chaveDedupe: chave,
    });
  }

  return candidatos;
}


/**
 * Gera os alertas de uma empresa, grava os novos e dispara o push de cada um.
 */
export async function gerarAlertasDaEmpresa(
  supabase: Supabase,
  empresa: Empresa,
): Promise<AlertaMimu[]> {
  const candidatos = await checkAlertas(supabase, empresa);
  if (candidatos.length === 0) return [];

  const { data } = await supabase
    .from("alertas_mimu")
    .insert(
      candidatos.map((c) => ({
        empresa_id: empresa.id,
        tipo: c.tipo,
        mensagem: c.mensagem,
        metadata: c.metadata
          ? (JSON.parse(JSON.stringify(c.metadata)) as Json)
          : null,
      })),
    )
    .select("*");

  const novos = data ?? [];

  // Push real (background) — silenciosa por design: nunca deve travar a
  // resposta se a pessoa não tiver inscrição ou as chaves VAPID faltarem.
  await Promise.all(
    novos.map((alerta) => {
      const meta = (alerta.metadata ?? {}) as AlertaMetadata;
      return enviarPushParaEmpresa(supabase, empresa.id, {
        title: "Mimu",
        body: alerta.mensagem ?? "",
        url: urlParaAlerta(alerta.tipo, meta),
      });
    }),
  );

  return novos;
}
