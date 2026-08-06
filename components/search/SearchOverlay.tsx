"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  DollarSign,
  Search,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useMountedTransition } from "@/hooks/useMountedTransition";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/formatters";

const DEBOUNCE_MS = 300;

interface ClienteResultado {
  id: string;
  nome: string;
  telefone: string | null;
}

interface TransacaoResultado {
  id: string;
  descricao: string | null;
  valor: number;
  tipo: "entrada" | "saida";
  data: string;
}

interface AgendamentoResultado {
  id: string;
  titulo: string;
  data_hora: string;
  status: string;
  cliente: { nome: string } | { nome: string }[] | null;
}

interface Resultados {
  clientes: ClienteResultado[];
  transacoes: TransacaoResultado[];
  agendamentos: AgendamentoResultado[];
}

const RESULTADOS_VAZIOS: Resultados = {
  clientes: [],
  transacoes: [],
  agendamentos: [],
};

function unicoPorId<T extends { id: string }>(...listas: T[][]): T[] {
  const mapa = new Map<string, T>();
  for (const lista of listas) {
    for (const item of lista) mapa.set(item.id, item);
  }
  return Array.from(mapa.values());
}

function nomeCliente(cliente: AgendamentoResultado["cliente"]): string | null {
  if (!cliente) return null;
  return Array.isArray(cliente) ? (cliente[0]?.nome ?? null) : cliente.nome;
}

export function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { empresa } = useEmpresa();
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const inputRef = useRef<HTMLInputElement>(null);

  const [termo, setTermo] = useState("");
  const [termoDebounced, setTermoDebounced] = useState("");
  const [resultados, setResultados] = useState<Resultados>(RESULTADOS_VAZIOS);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (open) {
      setTermo("");
      setTermoDebounced("");
      setResultados(RESULTADOS_VAZIOS);
      const id = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    const id = window.setTimeout(() => setTermoDebounced(termo.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [termo]);

  useEffect(() => {
    if (!empresa || !termoDebounced) {
      setResultados(RESULTADOS_VAZIOS);
      return;
    }

    let cancelado = false;
    async function buscar() {
      if (!empresa) return;
      setCarregando(true);

      const termoDigitos = termoDebounced.replace(/\D/g, "");
      const termoNumerico = Number(termoDebounced.replace(",", "."));
      const valorValido =
        /^\d+([.,]\d+)?$/.test(termoDebounced) && !Number.isNaN(termoNumerico);

      const [porNome, porTelefone] = await Promise.all([
        supabase
          .from("clientes")
          .select("id, nome, telefone")
          .eq("empresa_id", empresa.id)
          .ilike("nome", `%${termoDebounced}%`)
          .limit(6),
        termoDigitos.length >= 3
          ? supabase
              .from("clientes")
              .select("id, nome, telefone")
              .eq("empresa_id", empresa.id)
              .ilike("telefone", `%${termoDigitos}%`)
              .limit(6)
          : Promise.resolve({ data: [] as ClienteResultado[], error: null }),
      ]);

      const clientesEncontrados = unicoPorId(
        porNome.data ?? [],
        porTelefone.data ?? [],
      ).slice(0, 6);
      const clienteIds = clientesEncontrados.map((c) => c.id);

      const [porDescricao, porValor, porTitulo, porCliente] =
        await Promise.all([
          supabase
            .from("transacoes")
            .select("id, descricao, valor, tipo, data")
            .eq("empresa_id", empresa.id)
            .not("descricao", "is", null)
            .ilike("descricao", `%${termoDebounced}%`)
            .order("data", { ascending: false })
            .limit(6),
          valorValido
            ? supabase
                .from("transacoes")
                .select("id, descricao, valor, tipo, data")
                .eq("empresa_id", empresa.id)
                .eq("valor", termoNumerico)
                .order("data", { ascending: false })
                .limit(6)
            : Promise.resolve({ data: [] as TransacaoResultado[], error: null }),
          supabase
            .from("agendamentos")
            .select("id, titulo, data_hora, status, cliente:clientes(nome)")
            .eq("empresa_id", empresa.id)
            .ilike("titulo", `%${termoDebounced}%`)
            .order("data_hora", { ascending: false })
            .limit(6),
          clienteIds.length > 0
            ? supabase
                .from("agendamentos")
                .select("id, titulo, data_hora, status, cliente:clientes(nome)")
                .eq("empresa_id", empresa.id)
                .in("cliente_id", clienteIds)
                .order("data_hora", { ascending: false })
                .limit(6)
            : Promise.resolve({
                data: [] as AgendamentoResultado[],
                error: null,
              }),
        ]);

      if (cancelado) return;

      setResultados({
        clientes: clientesEncontrados,
        transacoes: unicoPorId(
          porDescricao.data ?? [],
          porValor.data ?? [],
        ).slice(0, 6) as TransacaoResultado[],
        agendamentos: unicoPorId(
          (porTitulo.data ?? []) as unknown as AgendamentoResultado[],
          (porCliente.data ?? []) as unknown as AgendamentoResultado[],
        ).slice(0, 6),
      });
      setCarregando(false);
    }

    buscar();
    return () => {
      cancelado = true;
    };
  }, [termoDebounced, empresa, supabase]);

  const { rendered, visible } = useMountedTransition(open, 200);
  if (!rendered) return null;

  function irPara(href: string) {
    onClose();
    router.push(href);
  }

  const semResultado =
    termoDebounced.length > 0 &&
    !carregando &&
    resultados.clientes.length === 0 &&
    resultados.transacoes.length === 0 &&
    resultados.agendamentos.length === 0;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] flex items-start justify-center bg-escuro/50 transition-opacity duration-200 sm:items-center sm:p-4",
        visible ? "opacity-100" : "opacity-0",
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "flex h-full w-full flex-col bg-superficie transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-opacity motion-reduce:duration-100 sm:h-auto sm:max-h-[75vh] sm:max-w-lg sm:rounded-card sm:shadow-xl",
          visible
            ? "scale-100 opacity-100"
            : "scale-[0.98] opacity-0 motion-reduce:scale-100",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-neutro-border p-4">
          <Search className="h-5 w-5 flex-shrink-0 text-neutro-muted" strokeWidth={2.25} />
          <input
            ref={inputRef}
            type="text"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Buscar clientes, transações, agendamentos..."
            className="flex-1 bg-transparent text-sm text-escuro outline-none placeholder:text-neutro-muted"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar busca"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-neutro-muted-strong hover:bg-fundo"
          >
            <X className="h-4 w-4" strokeWidth={2.25} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {termoDebounced.length === 0 && (
            <p className="py-10 text-center text-sm text-neutro-muted">
              Digite para buscar em clientes, financeiro e agenda.
            </p>
          )}

          {carregando && (
            <p className="py-10 text-center text-sm text-neutro-muted">
              Buscando...
            </p>
          )}

          {semResultado && (
            <p className="py-10 text-center text-sm text-neutro-muted">
              Nenhum resultado para &quot;{termoDebounced}&quot;
            </p>
          )}

          {!carregando && resultados.clientes.length > 0 && (
            <SecaoResultado icone={Users} titulo="Clientes">
              {resultados.clientes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => irPara(`/clientes/${c.id}`)}
                  className="flex w-full flex-col items-start rounded-button px-3 py-2.5 text-left hover:bg-fundo"
                >
                  <span className="text-sm font-semibold text-escuro">{c.nome}</span>
                  {c.telefone && (
                    <span className="text-xs text-neutro-muted">{c.telefone}</span>
                  )}
                </button>
              ))}
            </SecaoResultado>
          )}

          {!carregando && resultados.transacoes.length > 0 && (
            <SecaoResultado icone={DollarSign} titulo="Financeiro">
              {resultados.transacoes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => irPara(`/financeiro/${t.id}`)}
                  className="flex w-full items-center justify-between rounded-button px-3 py-2.5 text-left hover:bg-fundo"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-sm font-semibold text-escuro">
                      {t.descricao ?? "Sem descrição"}
                    </span>
                    <span className="text-xs text-neutro-muted">{formatDate(t.data)}</span>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      t.tipo === "entrada" ? "text-verde-dark" : "text-erro",
                    )}
                  >
                    {t.tipo === "entrada" ? "+" : "-"}
                    {formatCurrency(Number(t.valor))}
                  </span>
                </button>
              ))}
            </SecaoResultado>
          )}

          {!carregando && resultados.agendamentos.length > 0 && (
            <SecaoResultado icone={Calendar} titulo="Agenda">
              {resultados.agendamentos.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => irPara(`/agenda/${a.id}`)}
                  className="flex w-full flex-col items-start rounded-button px-3 py-2.5 text-left hover:bg-fundo"
                >
                  <span className="text-sm font-semibold text-escuro">{a.titulo}</span>
                  <span className="text-xs text-neutro-muted">
                    {formatDate(a.data_hora)}
                    {nomeCliente(a.cliente) ? ` · ${nomeCliente(a.cliente)}` : ""}
                  </span>
                </button>
              ))}
            </SecaoResultado>
          )}
        </div>
      </div>
    </div>
  );
}

function SecaoResultado({
  icone: Icone,
  titulo,
  children,
}: {
  icone: typeof Users;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="mb-1.5 flex items-center gap-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-neutro-muted">
        <Icone className="h-3.5 w-3.5" strokeWidth={2.25} />
        {titulo}
      </p>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
