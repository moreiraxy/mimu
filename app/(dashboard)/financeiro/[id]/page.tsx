"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { iconePorCategoria } from "@/lib/categories";
import { LABEL_FORMA_PAGAMENTO } from "@/lib/formasPagamento";
import { TransacaoForm, type DadosFormularioTransacao } from "../TransacaoForm";
import type { Transacao, TransacaoComCliente } from "@/types";

export default function DetalheTransacaoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());

  const [transacao, setTransacao] = useState<TransacaoComCliente | null>(null);
  const [parcelasIrmas, setParcelasIrmas] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento(null);

    const { data, error } = await supabase
      .from("transacoes")
      .select("*, cliente:clientes(*)")
      .eq("id", id)
      .single();

    if (error || !data) {
      setErroCarregamento("Lançamento não encontrado.");
      setLoading(false);
      return;
    }

    const registro = data as unknown as TransacaoComCliente;
    setTransacao(registro);

    if (registro.parcelas > 1 && registro.grupo_parcelamento_id) {
      const { data: irmas } = await supabase
        .from("transacoes")
        .select("*")
        .eq("grupo_parcelamento_id", registro.grupo_parcelamento_id)
        .order("parcela_atual", { ascending: true });
      setParcelasIrmas(irmas ?? []);
    } else {
      setParcelasIrmas([]);
    }

    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleExcluir() {
    if (!transacao) return;
    const { error } = await supabase
      .from("transacoes")
      .delete()
      .eq("id", transacao.id);

    setConfirmandoExclusao(false);

    if (error) {
      showToast("Não foi possível excluir. Tente de novo.");
      return;
    }

    showToast("Lançamento excluído.");
    router.push("/financeiro");
  }

  async function handleSalvarEdicao(dados: DadosFormularioTransacao) {
    if (!transacao) return;
    setEnviando(true);
    setErroFormulario(null);

    const { error } = await supabase
      .from("transacoes")
      .update({
        valor: dados.valor,
        descricao: dados.descricao || null,
        categoria: dados.categoria || null,
        cliente_id: dados.cliente?.id ?? null,
        forma_pagamento: dados.formaPagamento,
        data: dados.data,
        status_pagamento: dados.contaPendente ? "pendente" : "pago",
        data_vencimento: dados.contaPendente ? dados.dataVencimento : null,
      })
      .eq("id", transacao.id);

    setEnviando(false);

    if (error) {
      setErroFormulario("Não foi possível salvar. Tente de novo.");
      return;
    }

    showToast("Lançamento atualizado.");
    setEditando(false);
    carregar();
  }

  if (loading) {
    return (
      <div>
        <PageHeader title="Detalhes" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      </div>
    );
  }

  if (erroCarregamento || !transacao) {
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
        <PageHeader title="Editar lançamento" onBack={() => setEditando(false)} />
        <TransacaoForm
          tipo={transacao.tipo}
          podeParcelar={false}
          textoBotao="Salvar alterações"
          enviando={enviando}
          erro={erroFormulario}
          valoresIniciais={{
            valor: Number(transacao.valor),
            descricao: transacao.descricao ?? "",
            categoria: transacao.categoria ?? "",
            cliente: transacao.cliente
              ? { id: transacao.cliente.id, nome: transacao.cliente.nome }
              : null,
            formaPagamento: transacao.forma_pagamento,
            data: transacao.data,
            contaPendente: transacao.status_pagamento === "pendente",
            dataVencimento: transacao.data_vencimento,
          }}
          onSubmit={handleSalvarEdicao}
        />
      </div>
    );
  }

  const positiva = transacao.tipo === "entrada";
  const IconeCategoria = iconePorCategoria(transacao.categoria);

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

      <div className="flex flex-col items-center gap-1 rounded-card border border-neutro-border bg-superficie p-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-fundo text-neutro-muted-strong">
          <IconeCategoria className="h-6 w-6" strokeWidth={2} />
        </span>
        <p
          className={`mt-2 text-2xl font-bold ${positiva ? "text-verde-texto" : "text-erro-texto"}`}
        >
          {positiva ? "+" : "−"} {formatCurrency(Number(transacao.valor))}
        </p>
        <p className="text-sm text-neutro-muted">
          {transacao.descricao || transacao.categoria || "Sem descrição"}
        </p>
      </div>

      <div className="mt-4 flex flex-col divide-y divide-neutro-border rounded-card border border-neutro-border bg-superficie">
        <LinhaDetalhe label="Tipo" valor={positiva ? "Entrada" : "Saída"} />
        <LinhaDetalhe label="Categoria" valor={transacao.categoria ?? "—"} />
        <LinhaDetalhe label="Cliente" valor={transacao.cliente?.nome ?? "—"} />
        <LinhaDetalhe
          label="Forma de pagamento"
          valor={
            transacao.forma_pagamento
              ? LABEL_FORMA_PAGAMENTO[transacao.forma_pagamento]
              : "—"
          }
        />
        <LinhaDetalhe label="Data" valor={formatDate(transacao.data)} />
        {transacao.parcelas > 1 && (
          <LinhaDetalhe
            label="Parcela"
            valor={`${transacao.parcela_atual}/${transacao.parcelas}`}
          />
        )}
      </div>

      {parcelasIrmas.length > 0 && (
        <div className="mt-4 rounded-card border border-neutro-border bg-superficie p-4">
          <p className="text-sm font-semibold text-escuro">
            Parcelas dessa compra
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {parcelasIrmas.map((parcela) => {
              const vencida = new Date(`${parcela.data}T00:00:00`) <= new Date();
              return (
                <div
                  key={parcela.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-escuro">
                    {parcela.parcela_atual}/{parcela.parcelas} ·{" "}
                    {formatDate(parcela.data)}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-semibold text-escuro">
                      {formatCurrency(Number(parcela.valor))}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        vencida
                          ? "bg-verde-light text-verde-texto"
                          : "bg-ambar-light text-ambar-texto"
                      }`}
                    >
                      {vencida ? "Realizada" : "A vencer"}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Button
        variant="secondary"
        className="mt-6 w-full border-erro text-erro-texto"
        onClick={() => setConfirmandoExclusao(true)}
      >
        Excluir
      </Button>

      <ConfirmDialog
        open={confirmandoExclusao}
        title="Tem certeza?"
        description="Isso não pode ser desfeito."
        confirmLabel="Excluir"
        onConfirm={handleExcluir}
        onCancel={() => setConfirmandoExclusao(false)}
      />
    </div>
  );
}

function LinhaDetalhe({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-neutro-muted">{label}</span>
      <span className="text-sm font-medium text-escuro">{valor}</span>
    </div>
  );
}
