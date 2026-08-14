"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DollarSign, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDataComDiaSemana, formatDateShort, formatTime } from "@/lib/formatters";
import { paraISOLocal } from "@/lib/utils";
import { STATUS_CONFIG, formatarDuracao } from "../status";
import { AgendamentoForm, type DadosFormularioAgendamento } from "../AgendamentoForm";
import { ConcluirBottomSheet } from "./ConcluirBottomSheet";
import type { Agendamento, AgendamentoComCliente, FormaPagamento } from "@/types";

export default function DetalheAgendamentoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { empresa } = useEmpresa();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());

  const [agendamento, setAgendamento] = useState<AgendamentoComCliente | null>(
    null,
  );
  const [historico, setHistorico] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(
    null,
  );
  const [editando, setEditando] = useState(false);
  const [enviandoEdicao, setEnviandoEdicao] = useState(false);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  const [confirmandoCancelamento, setConfirmandoCancelamento] =
    useState(false);
  const [confirmandoFalta, setConfirmandoFalta] = useState(false);
  const [concluirAberto, setConcluirAberto] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento(null);

    const { data, error } = await supabase
      .from("agendamentos")
      .select("*, cliente:clientes(*)")
      .eq("id", id)
      .single();

    if (error || !data) {
      setErroCarregamento("Agendamento não encontrado.");
      setLoading(false);
      return;
    }

    const registro = data as unknown as AgendamentoComCliente;
    setAgendamento(registro);

    if (registro.cliente_id) {
      const { data: outros } = await supabase
        .from("agendamentos")
        .select("*")
        .eq("cliente_id", registro.cliente_id)
        .neq("id", registro.id)
        .order("data_hora", { ascending: false })
        .limit(5);
      setHistorico(outros ?? []);
    } else {
      setHistorico([]);
    }

    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function atualizarStatus(
    novoStatus: "confirmado" | "nao_compareceu",
    mensagem: string,
  ) {
    if (!agendamento) return;
    const { error } = await supabase
      .from("agendamentos")
      .update({ status: novoStatus })
      .eq("id", agendamento.id);

    if (error) {
      showToast("Não foi possível atualizar. Tente de novo.");
      return;
    }

    showToast(mensagem);
    carregar();
  }

  async function handleCancelar() {
    if (!agendamento) return;
    const { error } = await supabase
      .from("agendamentos")
      .delete()
      .eq("id", agendamento.id);

    setConfirmandoCancelamento(false);

    if (error) {
      showToast("Não foi possível cancelar. Tente de novo.");
      return;
    }

    showToast("Agendamento cancelado.");
    router.push("/agenda");
  }

  async function handleNaoCompareceu() {
    await atualizarStatus("nao_compareceu", "Marcado como não compareceu.");
    setConfirmandoFalta(false);
  }

  async function handleConfirmarRecebimento(
    valor: number,
    formaPagamento: FormaPagamento | null,
  ) {
    if (!agendamento || !empresa) return;

    const { data: transacao, error: erroTransacao } = await supabase
      .from("transacoes")
      .insert({
        empresa_id: empresa.id,
        cliente_id: agendamento.cliente_id,
        agendamento_id: agendamento.id,
        tipo: "entrada",
        valor,
        descricao: agendamento.titulo,
        categoria: "Serviço",
        forma_pagamento: formaPagamento,
        data: paraISOLocal(new Date()),
        parcelas: 1,
        parcela_atual: 1,
      })
      .select("id")
      .single();

    if (erroTransacao || !transacao) {
      showToast("Não foi possível registrar o recebimento.");
      return;
    }

    const { error: erroAgendamento } = await supabase
      .from("agendamentos")
      .update({
        status: "concluido",
        pagamento_registrado: true,
        transacao_id: transacao.id,
      })
      .eq("id", agendamento.id);

    setConcluirAberto(false);

    if (erroAgendamento) {
      showToast("Recebimento criado, mas não consegui atualizar o agendamento.");
      carregar();
      return;
    }

    showToast("Recebimento confirmado!", DollarSign);
    carregar();
  }

  async function handleSalvarEdicao(dados: DadosFormularioAgendamento) {
    if (!agendamento) return;
    setEnviandoEdicao(true);
    setErroFormulario(null);

    const dataHora = new Date(`${dados.data}T${dados.horario}:00`);

    const { error } = await supabase
      .from("agendamentos")
      .update({
        cliente_id: dados.cliente?.id ?? null,
        titulo: dados.titulo,
        descricao: dados.observacoes || null,
        valor_previsto: dados.valorPrevisto,
        data_hora: dataHora.toISOString(),
        duracao_minutos: dados.duracaoMinutos,
        status: dados.status,
      })
      .eq("id", agendamento.id);

    setEnviandoEdicao(false);

    if (error) {
      setErroFormulario("Não foi possível salvar. Tente de novo.");
      return;
    }

    showToast("Agendamento atualizado.");
    setEditando(false);
    carregar();
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Detalhes" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      </div>
    );
  }

  if (erroCarregamento || !agendamento) {
    return (
      <div>
        <PageHeader title="Detalhes" />
        <p className="mt-6 text-center text-sm text-neutro-muted">
          {erroCarregamento}
        </p>
      </div>
    );
  }

  if (editando) {
    return (
      <div className="lg:mx-auto lg:max-w-[560px]">
        <PageHeader
          title="Editar agendamento"
          onBack={() => setEditando(false)}
        />
        <AgendamentoForm
          textoBotao="Salvar alterações"
          enviando={enviandoEdicao}
          erro={erroFormulario}
          valoresIniciais={{
            cliente: agendamento.cliente
              ? {
                  id: agendamento.cliente.id,
                  nome: agendamento.cliente.nome,
                  cliente_fiel: agendamento.cliente.cliente_fiel,
                }
              : null,
            titulo: agendamento.titulo,
            valorPrevisto: agendamento.valor_previsto,
            data: paraISOLocal(new Date(agendamento.data_hora)),
            horario: formatTime(agendamento.data_hora).replace("h", ":"),
            duracaoMinutos: agendamento.duracao_minutos,
            observacoes: agendamento.descricao ?? "",
            status:
              agendamento.status === "confirmado" ? "confirmado" : "pendente",
          }}
          onSubmit={handleSalvarEdicao}
        />
      </div>
    );
  }

  const config = STATUS_CONFIG[agendamento.status];

  return (
    <div className="lg:mx-auto lg:max-w-3xl">
      <PageHeader
        title="Detalhes"
        action={
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="text-sm font-semibold text-primary-forte"
          >
            Editar
          </button>
        }
      />

      <div className="rounded-card border border-neutro-border bg-superficie p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-semibold text-escuro">
            {agendamento.titulo}
          </p>
          <span
            className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${config.corBg} ${config.corTexto}`}
          >
            {config.label}
          </span>
        </div>
        <p className="mt-1 text-sm text-neutro-muted">
          {formatDataComDiaSemana(new Date(agendamento.data_hora))} ·{" "}
          {formatTime(agendamento.data_hora)}
          {agendamento.duracao_minutos
            ? ` · ${formatarDuracao(agendamento.duracao_minutos)}`
            : ""}
        </p>
        {agendamento.valor_previsto ? (
          <p className="mt-2 text-xl font-semibold text-primary-forte">
            {formatCurrency(agendamento.valor_previsto)}
          </p>
        ) : null}
        {agendamento.descricao && (
          <p className="mt-2 text-sm text-escuro">{agendamento.descricao}</p>
        )}
      </div>

      {agendamento.status === "pendente" && (
        <div className="mt-4 flex gap-3">
          <Button
            className="flex-1 bg-verde hover:bg-verde-dark"
            onClick={() => atualizarStatus("confirmado", "Agendamento confirmado.")}
          >
            Confirmar
          </Button>
          <Button
            variant="secondary"
            className="flex-1 border-erro text-erro-texto"
            onClick={() => setConfirmandoCancelamento(true)}
          >
            Cancelar
          </Button>
        </div>
      )}

      {agendamento.status === "confirmado" && (
        <div className="mt-4 flex flex-col gap-3">
          <Button
            className="w-full bg-verde hover:bg-verde-dark"
            onClick={() => setConcluirAberto(true)}
          >
            Concluir e receber
          </Button>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setConfirmandoFalta(true)}
            >
              Não compareceu
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setEditando(true)}
            >
              Remarcar
            </Button>
          </div>
        </div>
      )}

      {agendamento.cliente && (
        <div className="mt-4 rounded-card border border-neutro-border bg-superficie p-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-escuro">
              {agendamento.cliente.nome}
            </p>
            {agendamento.cliente.cliente_fiel && (
              <span className="flex items-center gap-1 rounded-full bg-ambar-soft px-2 py-0.5 text-[10px] font-semibold text-ambar-texto">
                <Star className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
                Cliente Fiel
              </span>
            )}
          </div>
          <div className="mt-3 flex divide-x divide-neutro-border">
            <EstatCliente
              label="visitas"
              valor={String(agendamento.cliente.total_visitas)}
            />
            <EstatCliente
              label="total"
              valor={formatCurrency(agendamento.cliente.total_gasto)}
            />
            <EstatCliente
              label="faltas"
              valor={String(agendamento.cliente.faltas)}
            />
          </div>
          {historico.length > 0 && (
            <div className="mt-3 flex flex-col gap-2 border-t border-neutro-border pt-3">
              <p className="text-xs font-semibold text-neutro-muted">
                Últimos atendimentos
              </p>
              {historico.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-escuro">
                    {formatDateShort(item.data_hora)} · {item.titulo}
                  </span>
                  <span className={STATUS_CONFIG[item.status].corTexto}>
                    {STATUS_CONFIG[item.status].label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ConcluirBottomSheet
        open={concluirAberto}
        valorInicial={agendamento.valor_previsto}
        onConfirmar={handleConfirmarRecebimento}
        onFechar={() => setConcluirAberto(false)}
      />

      <ConfirmDialog
        open={confirmandoCancelamento}
        title="Cancelar agendamento?"
        description="Isso não pode ser desfeito."
        confirmLabel="Cancelar agendamento"
        onConfirm={handleCancelar}
        onCancel={() => setConfirmandoCancelamento(false)}
      />

      <ConfirmDialog
        open={confirmandoFalta}
        title="Marcar como não compareceu?"
        description="Isso sai do faturamento previsto e conta como falta do cliente."
        confirmLabel="Confirmar"
        onConfirm={handleNaoCompareceu}
        onCancel={() => setConfirmandoFalta(false)}
      />
    </div>
  );
}

function EstatCliente({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-sm font-semibold text-escuro">{valor}</p>
      <p className="text-[10px] text-neutro-muted">{label}</p>
    </div>
  );
}
