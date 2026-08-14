"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CalendarioInline } from "@/components/ui/CalendarioInline";
import { ClienteSearchInput, type ClienteOpcao } from "@/components/ClienteSearchInput";
import { formatCurrency } from "@/lib/formatters";
import { cn, paraISOLocal } from "@/lib/utils";
import { OPCOES_DURACAO, gerarHorarios } from "./status";

export interface DadosFormularioAgendamento {
  cliente: ClienteOpcao | null;
  titulo: string;
  valorPrevisto: number | null;
  data: string;
  horario: string;
  duracaoMinutos: number | null;
  observacoes: string;
  status: "confirmado" | "pendente";
}

interface HistoricoItem {
  titulo: string;
  valor_previsto: number | null;
}

const HORARIOS = gerarHorarios();

function formatarCentavos(centavos: number) {
  return formatCurrency(centavos / 100);
}

export function AgendamentoForm({
  valoresIniciais,
  textoBotao = "Salvar agendamento",
  enviando = false,
  erro,
  onSubmit,
}: {
  valoresIniciais?: Partial<DadosFormularioAgendamento>;
  textoBotao?: string;
  enviando?: boolean;
  erro?: string | null;
  onSubmit: (dados: DadosFormularioAgendamento) => void | Promise<void>;
}) {
  const { empresa } = useEmpresa();
  const [supabase] = useState(() => createClient());

  const [cliente, setCliente] = useState<ClienteOpcao | null>(
    valoresIniciais?.cliente ?? null,
  );
  const [titulo, setTitulo] = useState(valoresIniciais?.titulo ?? "");
  const [centavos, setCentavos] = useState(
    valoresIniciais?.valorPrevisto
      ? Math.round(valoresIniciais.valorPrevisto * 100)
      : 0,
  );
  const [data, setData] = useState(
    valoresIniciais?.data ?? paraISOLocal(new Date()),
  );
  const [calendarioAberto, setCalendarioAberto] = useState(false);
  const [horario, setHorario] = useState(valoresIniciais?.horario ?? "09:00");
  const [duracaoMinutos, setDuracaoMinutos] = useState<number | null>(
    valoresIniciais?.duracaoMinutos ?? null,
  );
  const [observacoes, setObservacoes] = useState(
    valoresIniciais?.observacoes ?? "",
  );
  const [status, setStatus] = useState<"confirmado" | "pendente">(
    valoresIniciais?.status ?? "confirmado",
  );
  const [historicoCliente, setHistoricoCliente] = useState<HistoricoItem[]>(
    [],
  );

  useEffect(() => {
    if (!cliente || !empresa) {
      setHistoricoCliente([]);
      return;
    }
    supabase
      .from("agendamentos")
      .select("titulo, valor_previsto")
      .eq("empresa_id", empresa.id)
      .eq("cliente_id", cliente.id)
      .order("data_hora", { ascending: false })
      .limit(20)
      .then(({ data: linhas }) => setHistoricoCliente(linhas ?? []));
  }, [cliente, empresa, supabase]);

  const sugestoesTitulo = useMemo(
    () => Array.from(new Set(historicoCliente.map((h) => h.titulo))).slice(0, 6),
    [historicoCliente],
  );

  // Autopreenche o valor previsto se o serviço digitado já tem histórico com
  // esse cliente — só quando o valor ainda não foi digitado manualmente.
  useEffect(() => {
    const correspondencia = historicoCliente.find(
      (h) => h.titulo.toLowerCase() === titulo.trim().toLowerCase(),
    );
    if (!correspondencia?.valor_previsto) return;
    setCentavos((atual) =>
      atual === 0
        ? Math.round(Number(correspondencia.valor_previsto) * 100)
        : atual,
    );
  }, [titulo, historicoCliente]);

  function handleDigitarValor(event: React.ChangeEvent<HTMLInputElement>) {
    const somenteDigitos = event.target.value.replace(/\D/g, "");
    setCentavos(somenteDigitos ? Number(somenteDigitos) : 0);
  }

  const podeConfirmar = titulo.trim() !== "" && !enviando;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!podeConfirmar) return;

    onSubmit({
      cliente,
      titulo: titulo.trim(),
      valorPrevisto: centavos > 0 ? centavos / 100 : null,
      data,
      horario,
      duracaoMinutos,
      observacoes: observacoes.trim(),
      status,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <ClienteSearchInput value={cliente} onChange={setCliente} />
        {cliente?.cliente_fiel && (
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-ambar-soft px-2.5 py-1 text-xs font-semibold text-ambar-text">
            <Star className="h-3 w-3" fill="currentColor" strokeWidth={0} />
            Cliente Fiel
          </span>
        )}
      </div>

      <div>
        <Input
          label="Serviço / título"
          placeholder="Ex.: Corte + escova"
          value={titulo}
          onChange={(event) => setTitulo(event.target.value)}
          list="sugestoes-titulo"
        />
        {sugestoesTitulo.length > 0 && (
          <datalist id="sugestoes-titulo">
            {sugestoesTitulo.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </div>

      <div className="flex flex-col items-center">
        <p className="mb-2 self-start text-xs font-semibold text-neutro-muted">
          Valor previsto
        </p>
        <input
          type="text"
          inputMode="numeric"
          value={formatarCentavos(centavos)}
          onChange={handleDigitarValor}
          aria-label="Valor previsto"
          className="w-full max-w-[240px] rounded-button border border-neutro-border bg-superficie px-4 py-3 text-center text-2xl font-semibold text-primary-forte outline-none focus:border-primary-forte"
        />
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-neutro-muted">Data</p>
        <button
          type="button"
          onClick={() => setCalendarioAberto((v) => !v)}
          className="w-full rounded-button border border-neutro-border bg-superficie px-3.5 py-3 text-left text-sm text-escuro"
        >
          {new Date(`${data}T00:00:00`).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </button>
        {calendarioAberto && (
          <div className="mt-2 rounded-card border border-neutro-border bg-superficie p-4">
            <CalendarioInline
              value={data}
              onChange={(iso) => {
                setData(iso);
                setCalendarioAberto(false);
              }}
            />
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-neutro-muted">
          Horário
        </p>
        <div className="-mx-4 flex gap-2 overflow-x-auto scroll-fade-x px-4 pb-1">
          {HORARIOS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHorario(h)}
              className={cn(
                "flex-shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                horario === h
                  ? "border-primary-forte bg-primary text-primary-text"
                  : "border-neutro-border bg-superficie text-escuro",
              )}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-neutro-muted">
          Duração (opcional)
        </p>
        <div className="flex flex-wrap gap-2">
          {OPCOES_DURACAO.map((opcao) => (
            <button
              key={opcao.minutos}
              type="button"
              onClick={() =>
                setDuracaoMinutos((atual) =>
                  atual === opcao.minutos ? null : opcao.minutos,
                )
              }
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors",
                duracaoMinutos === opcao.minutos
                  ? "border-primary-forte bg-primary text-primary-text"
                  : "border-neutro-border bg-superficie text-escuro",
              )}
            >
              {opcao.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Observações (opcional)"
        placeholder="Alguma observação sobre o atendimento"
        value={observacoes}
        onChange={(event) => setObservacoes(event.target.value)}
      />

      <div>
        <p className="mb-2 text-xs font-semibold text-neutro-muted">
          Status inicial
        </p>
        <div className="flex gap-2">
          {(["confirmado", "pendente"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "flex-1 rounded-button border py-2.5 text-sm font-semibold transition-colors",
                status === s
                  ? "border-primary-forte bg-primary text-primary-text"
                  : "border-neutro-border bg-superficie text-escuro",
              )}
            >
              {s === "confirmado" ? "Confirmado" : "Pendente"}
            </button>
          ))}
        </div>
      </div>

      {erro && (
        <p className="rounded-button bg-erro-light px-3 py-2 text-sm text-erro">
          {erro}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={!podeConfirmar}>
        {enviando ? "Salvando..." : textoBotao}
      </Button>
    </form>
  );
}
