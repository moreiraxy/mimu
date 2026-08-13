"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search, Users, CreditCard, Clock, AlertTriangle, ChevronDown, Check,
} from "lucide-react";
import { MODULOS } from "@/lib/modulos";
import { Skeleton } from "@/components/ui/Skeleton";
import { FadeIn } from "@/components/ui/FadeIn";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { ContaAdmin } from "@/lib/admin";

type Resumo = {
  total: number;
  pagantes: number;
  emTrial: number;
  vencidas: number;
  novosHoje: number;
  receitaMensal: number;
};

type Filtro = "todas" | "ativa" | "trial" | "vencidas";

const FILTROS: { id: Filtro; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "ativa", label: "Pagantes" },
  { id: "trial", label: "Em teste" },
  { id: "vencidas", label: "Vencidas" },
];

/** Rótulo e cor por status — o texto é o que a dona do produto lê, não o enum do banco. */
const STATUS: Record<string, { texto: string; classe: string }> = {
  ativa: { texto: "Pagante", classe: "bg-verde-light text-verde-dark" },
  trial: { texto: "Em teste", classe: "bg-ambar-light text-ambar-dark" },
  vencida: { texto: "Vencida", classe: "bg-coral-light text-coral" },
  cancelada: { texto: "Cancelada", classe: "bg-neutro-border text-neutro-muted-strong" },
  sem_assinatura: {
    texto: "Sem assinatura",
    classe: "bg-neutro-border text-neutro-muted-strong",
  },
};

export default function PainelAdmin() {
  const [contas, setContas] = useState<ContaAdmin[]>([]);
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todas");

  useEffect(() => {
    let ativo = true;
    fetch("/api/admin/contas")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => {
        if (!ativo) return;
        setContas(d.contas);
        setResumo(d.resumo);
      })
      .catch(() => ativo && setErro("Não consegui carregar as contas."))
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, []);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return contas.filter((c) => {
      const casaFiltro =
        filtro === "todas"
          ? true
          : filtro === "vencidas"
            ? ["vencida", "cancelada"].includes(c.status_assinatura)
            : c.status_assinatura === filtro;
      if (!casaFiltro) return false;
      if (!termo) return true;
      return (
        c.nome_negocio?.toLowerCase().includes(termo) ||
        c.email?.toLowerCase().includes(termo) ||
        c.tipo_negocio?.toLowerCase().includes(termo)
      );
    });
  }, [contas, busca, filtro]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-10 sm:px-8">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold text-escuro sm:text-3xl">
          Painel
        </h1>
        <p className="mt-1 text-sm text-neutro-muted">
          Contas da Mimu, assinaturas e módulos.
        </p>
      </header>

      {erro && (
        <p className="rounded-xl bg-coral-light px-4 py-3 text-sm text-coral">
          {erro}
        </p>
      )}

      {carregando ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        resumo && (
          <FadeIn>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Indicador
                icone={Users}
                rotulo="Contas"
                valor={String(resumo.total)}
                // O badge que você pediu: some quando é zero, pra não virar
                // ruído num dia sem cadastro.
                selo={resumo.novosHoje > 0 ? `+${resumo.novosHoje} hoje` : null}
              />
              <Indicador
                icone={CreditCard}
                rotulo="Pagantes"
                valor={String(resumo.pagantes)}
                selo={formatCurrency(resumo.receitaMensal) + "/mês"}
              />
              <Indicador
                icone={Clock}
                rotulo="Em teste"
                valor={String(resumo.emTrial)}
              />
              <Indicador
                icone={AlertTriangle}
                rotulo="Vencidas"
                valor={String(resumo.vencidas)}
              />
            </div>
          </FadeIn>
        )
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutro-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por negócio, e-mail ou tipo"
            className="h-11 w-full rounded-xl border border-neutro-border bg-superficie pl-10 pr-4 text-sm text-escuro outline-none placeholder:text-neutro-muted focus:border-coral"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`h-11 shrink-0 rounded-xl px-4 text-sm font-bold transition-colors ${
                filtro === f.id
                  ? "bg-coral text-white"
                  : "bg-superficie text-neutro-muted-strong hover:text-escuro"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-neutro-muted">
        {visiveis.length} de {contas.length} contas
      </p>

      <div className="mt-3 flex flex-col gap-2">
        {visiveis.map((c) => (
          <LinhaConta key={c.empresa_id} conta={c} />
        ))}
        {!carregando && visiveis.length === 0 && (
          <p className="rounded-xl bg-superficie px-4 py-8 text-center text-sm text-neutro-muted">
            Nenhuma conta com esse filtro.
          </p>
        )}
      </div>
    </main>
  );
}

function Indicador({
  icone: Icone,
  rotulo,
  valor,
  selo = null,
}: {
  icone: React.ElementType;
  rotulo: string;
  valor: string;
  selo?: string | null;
}) {
  return (
    <div className="rounded-2xl bg-superficie p-5">
      <div className="flex items-center gap-2 text-neutro-muted">
        <Icone className="h-4 w-4" />
        <span className="text-xs font-bold uppercase tracking-wide">{rotulo}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-escuro">{valor}</p>
      {selo && <p className="mt-0.5 text-xs font-bold text-coral">{selo}</p>}
    </div>
  );
}

function LinhaConta({ conta }: { conta: ContaAdmin }) {
  const status = STATUS[conta.status_assinatura] ?? STATUS.sem_assinatura!;
  const dias = conta.dias_restantes_trial;
  const [aberta, setAberta] = useState(false);
  // Cópia local: a lista já vem do servidor, e reconsultar tudo a cada
  // clique piscaria a tela inteira. O servidor continua sendo a verdade —
  // se o PATCH falhar, isto volta ao que era.
  const [modulos, setModulos] = useState<string[]>(conta.modulos_ativos ?? []);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function alternar(chaves: string[]) {
    const ligado = chaves.every((c) => modulos.includes(c));
    const proximo = ligado
      ? modulos.filter((m) => !chaves.includes(m))
      : Array.from(new Set([...modulos, ...chaves]));

    const anterior = modulos;
    setModulos(proximo);
    setSalvando(true);
    setErro(null);

    try {
      const r = await fetch(`/api/admin/contas/${conta.empresa_id}/modulos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modulos: proximo }),
      });
      if (!r.ok) throw new Error(String(r.status));
    } catch {
      setModulos(anterior); // desfaz: o servidor não aceitou
      setErro("Não consegui salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <article className="rounded-2xl bg-superficie">
      <button
        type="button"
        onClick={() => setAberta((v) => !v)}
        className="flex w-full flex-col gap-3 p-4 text-left sm:flex-row sm:items-center sm:gap-4"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-escuro">{conta.nome_negocio}</p>
          <p className="truncate text-xs text-neutro-muted">
            {conta.email}
            {conta.tipo_negocio ? ` · ${conta.tipo_negocio}` : ""}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.classe}`}>
            {status.texto}
          </span>

          {dias !== null && (
            <span className={`text-xs font-bold ${dias <= 3 ? "text-coral" : "text-neutro-muted-strong"}`}>
              {dias > 0 ? `${dias}d restantes` : "trial vencido"}
            </span>
          )}

          <span className="text-xs text-neutro-muted">{modulos.length} módulos</span>
          <span className="text-xs text-neutro-muted">entrou {formatDate(conta.entrou_em)}</span>

          <ChevronDown
            className={`h-4 w-4 text-neutro-muted transition-transform ${aberta ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {aberta && (
        <div className="border-t border-neutro-border px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wide text-neutro-muted">
              Módulos
            </p>
            {salvando && <span className="text-xs text-neutro-muted">salvando…</span>}
            {erro && <span className="text-xs font-bold text-coral">{erro}</span>}
          </div>

          <div className="flex flex-wrap gap-2">
            {MODULOS.map((m) => {
              const ligado = m.chaves.every((c) => modulos.includes(c));
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={salvando}
                  onClick={() => alternar([...m.chaves])}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold transition-colors disabled:opacity-50 ${
                    ligado
                      ? "border-coral bg-coral-light text-coral"
                      : "border-neutro-border text-neutro-muted-strong hover:text-escuro"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-md border ${
                      ligado ? "border-coral bg-coral" : "border-neutro-border"
                    }`}
                  >
                    {ligado && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                  </span>
                  {m.label}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-neutro-muted">
            Toda alteração aqui fica registrada com o seu e-mail e a data.
          </p>
        </div>
      )}
    </article>
  );
}
