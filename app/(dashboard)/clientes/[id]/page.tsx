"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { calcularFrequenciaMedia } from "@/lib/calculations";
import {
  formatCurrency,
  formatDateShort,
  formatRelativeDate,
  formatTempoCliente,
} from "@/lib/formatters";
import { ClienteForm, type DadosFormularioCliente } from "../ClienteForm";
import { ObservacoesCard } from "./ObservacoesCard";
import { RegistrarPagamentoDialog } from "./RegistrarPagamentoDialog";
import type { Agendamento, Cliente } from "@/types";

const LIMITE_HISTORICO_INICIAL = 10;

export default function PerfilClientePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [visitas, setVisitas] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(
    null,
  );
  const [editando, setEditando] = useState(false);
  const [enviandoEdicao, setEnviandoEdicao] = useState(false);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [mostrarTodasVisitas, setMostrarTodasVisitas] = useState(false);
  const [pagamentoAberto, setPagamentoAberto] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento(null);

    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      setErroCarregamento("Cliente não encontrado.");
      setLoading(false);
      return;
    }

    setCliente(data);

    const { data: agendamentos } = await supabase
      .from("agendamentos")
      .select("*")
      .eq("cliente_id", id)
      .eq("status", "concluido")
      .order("data_hora", { ascending: false })
      .limit(50);

    setVisitas(agendamentos ?? []);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const frequenciaMedia = useMemo(
    () => calcularFrequenciaMedia(visitas),
    [visitas],
  );

  const diasDesdeUltimoAtendimento = useMemo(() => {
    if (!cliente?.ultimo_atendimento) return null;
    const ultimo = new Date(`${cliente.ultimo_atendimento}T00:00:00`);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    return Math.round((hoje.getTime() - ultimo.getTime()) / 86400000);
  }, [cliente?.ultimo_atendimento]);

  const clienteSumido =
    frequenciaMedia > 0 &&
    diasDesdeUltimoAtendimento !== null &&
    diasDesdeUltimoAtendimento > frequenciaMedia * 2;

  async function handleSalvarObservacoes(texto: string) {
    if (!cliente) return;
    const { error } = await supabase
      .from("clientes")
      .update({ observacoes: texto || null })
      .eq("id", cliente.id);

    if (error) {
      showToast("Não foi possível salvar as observações.");
      return;
    }
    setCliente({ ...cliente, observacoes: texto || null });
  }

  async function handleRegistrarPagamento(valor: number) {
    if (!cliente) return;

    const { error: erroTransacao } = await supabase.from("transacoes").insert({
      empresa_id: cliente.empresa_id,
      cliente_id: cliente.id,
      tipo: "entrada",
      valor,
      descricao: "Pagamento de fiado",
      categoria: "Recebimento",
      data: new Date().toISOString().slice(0, 10),
      parcelas: 1,
      parcela_atual: 1,
    });

    if (erroTransacao) {
      showToast("Não foi possível registrar o pagamento.");
      return;
    }

    const novoSaldo = Math.max(0, Number(cliente.saldo_fiado) - valor);
    const { error: erroSaldo } = await supabase
      .from("clientes")
      .update({ saldo_fiado: novoSaldo })
      .eq("id", cliente.id);

    setPagamentoAberto(false);

    if (erroSaldo) {
      showToast("Pagamento registrado, mas não consegui atualizar o saldo.");
      carregar();
      return;
    }

    showToast("Pagamento registrado!");
    carregar();
  }

  async function handleSalvarEdicao(dados: DadosFormularioCliente) {
    if (!cliente) return;
    setEnviandoEdicao(true);
    setErroFormulario(null);

    const { error } = await supabase
      .from("clientes")
      .update({
        nome: dados.nome,
        telefone: dados.telefone || null,
        email: dados.email || null,
        data_nascimento: dados.dataNascimento || null,
        observacoes: dados.observacoes || null,
        saldo_fiado: dados.saldoFiado,
      })
      .eq("id", cliente.id);

    setEnviandoEdicao(false);

    if (error) {
      setErroFormulario("Não foi possível salvar. Tente de novo.");
      return;
    }

    showToast("Cliente atualizado.");
    setEditando(false);
    carregar();
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Perfil" />
        <div className="flex flex-col items-center gap-3 py-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="mt-4 h-20 w-full rounded-card" />
        <Skeleton className="mt-4 h-32 w-full rounded-card" />
      </div>
    );
  }

  if (erroCarregamento || !cliente) {
    return (
      <div>
        <PageHeader title="Perfil" />
        <p className="mt-6 text-center text-sm text-neutro-muted">
          {erroCarregamento}
        </p>
      </div>
    );
  }

  if (editando) {
    return (
      <div className="lg:mx-auto lg:max-w-[560px]">
        <PageHeader title="Editar cliente" onBack={() => setEditando(false)} />
        <ClienteForm
          textoBotao="Salvar alterações"
          enviando={enviandoEdicao}
          erro={erroFormulario}
          valoresIniciais={{
            nome: cliente.nome,
            telefone: cliente.telefone ?? "",
            email: cliente.email ?? "",
            dataNascimento: cliente.data_nascimento ?? "",
            observacoes: cliente.observacoes ?? "",
            saldoFiado: Number(cliente.saldo_fiado),
          }}
          onSubmit={handleSalvarEdicao}
        />
      </div>
    );
  }

  const visitasVisiveis = mostrarTodasVisitas
    ? visitas
    : visitas.slice(0, LIMITE_HISTORICO_INICIAL);
  const saldoFiado = Number(cliente.saldo_fiado);

  return (
    <div className="lg:mx-auto lg:max-w-3xl">
      <PageHeader title="Perfil" />

      <div className="flex flex-col items-center gap-2 text-center">
        <Avatar nome={cliente.nome} size="lg" />
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold text-escuro">{cliente.nome}</p>
          {cliente.cliente_fiel && (
            <span className="flex items-center gap-1 rounded-full bg-ambar-soft px-2 py-0.5 text-[11px] font-semibold text-ambar-texto">
              <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} />
              Cliente Fiel
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex divide-x divide-neutro-border vidro-card rounded-[20px] py-3">
        <Estatistica
          label="cliente há"
          valor={formatTempoCliente(cliente.created_at)}
        />
        <Estatistica label="visitas" valor={String(cliente.total_visitas)} />
        <Estatistica
          label="total gasto"
          valor={formatCurrency(cliente.total_gasto)}
        />
      </div>

      <div className="mt-4 vidro-card rounded-[20px] p-4">
        <p className="text-sm font-semibold text-escuro">Frequência</p>
        <p className="mt-2 text-sm text-neutro-muted">
          Último atendimento:{" "}
          {cliente.ultimo_atendimento
            ? formatRelativeDate(cliente.ultimo_atendimento)
            : "ainda não teve"}
        </p>
        {frequenciaMedia > 0 && (
          <p className="text-sm text-neutro-muted">
            Frequência média: a cada {Math.round(frequenciaMedia)} dias
          </p>
        )}
        {clienteSumido && (
          <p className="mt-3 rounded-button bg-ambar-light px-3 py-2 text-sm text-ambar-texto">
            Faz um tempo que {cliente.nome.split(" ")[0]} não aparece
          </p>
        )}
      </div>

      {saldoFiado > 0 && (
        <div className="mt-4 rounded-card bg-erro-light p-4">
          <p className="text-sm font-semibold text-erro-texto">
            Saldo fiado: {formatCurrency(saldoFiado)}
          </p>
          <Button
            size="sm"
            className="mt-3"
            onClick={() => setPagamentoAberto(true)}
          >
            Registrar pagamento
          </Button>
        </div>
      )}

      <div className="mt-4 vidro-card rounded-[20px] p-4">
        <p className="text-sm font-semibold text-escuro">
          Histórico de visitas
        </p>
        {visitasVisiveis.length === 0 ? (
          <p className="mt-2 text-sm text-neutro-muted">
            Nenhuma visita registrada ainda.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {visitasVisiveis.map((visita) => (
              <div
                key={visita.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-escuro">
                  {formatDateShort(visita.data_hora)} · {visita.titulo}
                </span>
                {visita.valor_previsto ? (
                  <span className="font-semibold text-escuro">
                    {formatCurrency(visita.valor_previsto)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        )}
        {!mostrarTodasVisitas && visitas.length > LIMITE_HISTORICO_INICIAL && (
          <button
            type="button"
            onClick={() => setMostrarTodasVisitas(true)}
            className="mt-3 text-xs font-semibold text-primary-forte"
          >
            Ver todas
          </button>
        )}
      </div>

      <div className="mt-4">
        <ObservacoesCard
          observacoes={cliente.observacoes}
          onSalvar={handleSalvarObservacoes}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href={`/agenda/novo?clienteId=${cliente.id}&clienteNome=${encodeURIComponent(cliente.nome)}`}
          className="w-full rounded-button bg-primary py-3 text-center text-sm font-bold text-primary-text"
        >
          Agendar novamente
        </Link>
        <Button variant="secondary" className="w-full" onClick={() => setEditando(true)}>
          Editar cliente
        </Button>
      </div>

      <RegistrarPagamentoDialog
        open={pagamentoAberto}
        saldoAtual={saldoFiado}
        onConfirmar={handleRegistrarPagamento}
        onFechar={() => setPagamentoAberto(false)}
      />
    </div>
  );
}

function Estatistica({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex-1 text-center">
      <p className="text-sm font-semibold text-escuro">{valor}</p>
      <p className="text-[10px] text-neutro-muted">{label}</p>
    </div>
  );
}
