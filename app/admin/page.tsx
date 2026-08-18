"use client";

import { useEffect, useMemo, useState } from "react";
import { SaudeSection } from "./SaudeSection";
import {
  Search, Users, CreditCard, Clock, AlertTriangle, ChevronDown, Check,
} from "lucide-react";
import { MODULOS } from "@/lib/modulos";
import { Skeleton } from "@/components/ui/Skeleton";
import { FadeIn } from "@/components/ui/FadeIn";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
  ativa: { texto: "Pagante", classe: "bg-verde-light text-verde-texto" },
  trial: { texto: "Em teste", classe: "bg-ambar-light text-ambar-texto" },
  vencida: { texto: "Vencida", classe: "bg-primary-light text-primary-forte" },
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

  // A conta some da lista sem recarregar tudo. Os indicadores do topo são
  // recalculados junto: deixar "Contas: 12" depois de excluir uma passaria a
  // impressão de que a exclusão não funcionou.
  function removerConta(empresaId: string) {
    const saindo = contas.find((c) => c.empresa_id === empresaId);
    setContas((atuais) => atuais.filter((c) => c.empresa_id !== empresaId));

    if (!saindo) return;
    setResumo((r) =>
      r === null
        ? r
        : {
            ...r,
            total: r.total - 1,
            pagantes:
              saindo.status_assinatura === "ativa" ? r.pagantes - 1 : r.pagantes,
            emTrial:
              saindo.status_assinatura === "trial" ? r.emTrial - 1 : r.emTrial,
            vencidas: ["vencida", "cancelada"].includes(saindo.status_assinatura)
              ? r.vencidas - 1
              : r.vencidas,
            receitaMensal:
              saindo.status_assinatura === "ativa"
                ? r.receitaMensal - (saindo.valor_mensal ?? 0)
                : r.receitaMensal,
          },
    );
  }

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

      <SaudeSection />

      {erro && (
        <p className="rounded-xl bg-primary-light px-4 py-3 text-sm text-primary-forte">
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
            className="h-11 w-full rounded-xl border border-neutro-border bg-superficie pl-10 pr-4 text-sm text-escuro outline-none placeholder:text-neutro-muted focus:border-primary-forte"
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
                  ? "bg-primary text-primary-text"
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
          <LinhaConta
            key={c.empresa_id}
            conta={c}
            onExcluida={removerConta}
          />
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
      {selo && <p className="mt-0.5 text-xs font-bold text-primary-forte">{selo}</p>}
    </div>
  );
}

function LinhaConta({
  conta,
  onExcluida,
}: {
  conta: ContaAdmin;
  onExcluida: (empresaId: string) => void;
}) {
  const status = STATUS[conta.status_assinatura] ?? STATUS.sem_assinatura!;
  const dias = conta.dias_restantes_trial;
  const [aberta, setAberta] = useState(false);
  // Cópia local: a lista já vem do servidor, e reconsultar tudo a cada
  // clique piscaria a tela inteira. O servidor continua sendo a verdade —
  // se o PATCH falhar, isto volta ao que era.
  const [modulos, setModulos] = useState<string[]>(conta.modulos_ativos ?? []);
  const [suspensaEm, setSuspensaEm] = useState<string | null>(conta.suspensa_em);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<"suspender" | "excluir" | null>(
    null,
  );

  const suspensa = suspensaEm !== null;

  async function mudarSuspensao(suspender: boolean) {
    const anterior = suspensaEm;
    setSuspensaEm(suspender ? new Date().toISOString() : null);
    setSalvando(true);
    setErro(null);

    try {
      const r = await fetch(`/api/admin/contas/${conta.empresa_id}/suspensao`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspender }),
      });
      if (!r.ok) {
        const corpo = await r.json().catch(() => null);
        throw new Error(corpo?.error ?? String(r.status));
      }
    } catch (e) {
      setSuspensaEm(anterior);
      setErro(e instanceof Error ? e.message : "Não consegui salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    setSalvando(true);
    setErro(null);
    try {
      const r = await fetch(`/api/admin/contas/${conta.empresa_id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        // A rota confere o nome de novo no servidor — o diálogo é a trava
        // para a pessoa, não a autorização.
        body: JSON.stringify({ confirmacao: conta.nome_negocio }),
      });
      if (!r.ok) {
        const corpo = await r.json().catch(() => null);
        throw new Error(corpo?.error ?? String(r.status));
      }
      onExcluida(conta.empresa_id);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não consegui excluir.");
      setSalvando(false);
    }
  }

  async function alternar(chaves: string[]) {
    const ligado = chaves.every((c) => modulos.includes(c));
    const proximo = ligado
      ? modulos.filter((m) => !chaves.includes(m))
      : Array.from(new Set([...modulos, ...chaves]));

    const anterior = modulos;
    setModulos(proximo);
    setSalvando(true);
    setErro(null);
    setSalvo(false);

    try {
      const r = await fetch(`/api/admin/contas/${conta.empresa_id}/modulos`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modulos: proximo }),
      });
      if (!r.ok) {
        // Mostra o motivo que veio do servidor em vez de um "não consegui"
        // genérico: quando isso falha, o texto exato é a única pista de por quê.
        const corpo = await r.json().catch(() => null);
        throw new Error(corpo?.error ?? `Erro ${r.status}`);
      }
      setSalvo(true);
    } catch (e) {
      setModulos(anterior); // desfaz: o servidor não aceitou
      setErro(e instanceof Error ? e.message : "Não consegui salvar.");
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
          {/* Suspensa vem antes do status de assinatura porque manda nele: a
              conta pode estar "Pagante" e mesmo assim sem acesso. */}
          {suspensa && (
            <span className="rounded-full bg-erro px-2.5 py-1 text-[11px] font-bold text-white">
              Suspensa
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.classe}`}>
            {status.texto}
          </span>

          {dias !== null && (
            <span className={`text-xs font-bold ${dias <= 3 ? "text-primary-forte" : "text-neutro-muted-strong"}`}>
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
            {!salvando && salvo && !erro && (
              <span className="flex items-center gap-1 text-xs font-bold text-verde-texto">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
                salvo
              </span>
            )}
            {erro && <span className="text-xs font-bold text-erro-texto">{erro}</span>}
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
                      ? "border-primary-forte bg-primary-light text-primary-forte"
                      : "border-neutro-border text-neutro-muted-strong hover:text-escuro"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-md border ${
                      ligado ? "border-primary-forte bg-primary" : "border-neutro-border"
                    }`}
                  >
                    {ligado && <Check className="h-3 w-3 text-primary-text" strokeWidth={3} />}
                  </span>
                  {m.label}
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-xs text-neutro-muted">
            Toda alteração aqui fica registrada com o seu e-mail e a data.
          </p>

          {/* Ações que tiram a pessoa da plataforma. Separadas por uma borda e
              jogadas para o fim de propósito: não devem ficar ao lado dos
              toggles de módulo, onde um clique errado é barato. */}
          <div className="mt-5 border-t border-neutro-border pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-neutro-muted">
              Acesso
            </p>
            <p className="mt-1.5 text-xs text-neutro-muted">
              {suspensa
                ? "A conta está bloqueada. Os dados continuam guardados e reativar devolve o acesso na hora."
                : "Suspender bloqueia o acesso na hora, sem apagar nada nem mexer na cobrança."}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={salvando}
                onClick={() =>
                  suspensa ? mudarSuspensao(false) : setConfirmando("suspender")
                }
                className={`rounded-xl border px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-50 ${
                  suspensa
                    ? "border-verde-dark text-verde-texto hover:bg-verde-light"
                    : "border-neutro-border text-neutro-muted-strong hover:text-escuro"
                }`}
              >
                {suspensa ? "Reativar acesso" : "Suspender acesso"}
              </button>

              <button
                type="button"
                disabled={salvando}
                onClick={() => setConfirmando("excluir")}
                className="rounded-xl border border-erro px-4 py-2.5 text-sm font-bold text-erro-texto transition-colors hover:bg-erro hover:text-white disabled:opacity-50"
              >
                Excluir conta
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmando === "suspender"}
        title={`Suspender ${conta.nome_negocio}?`}
        description="O acesso é bloqueado na hora. Nada é apagado e você pode reativar quando quiser."
        confirmLabel="Suspender"
        onConfirm={() => {
          setConfirmando(null);
          mudarSuspensao(true);
        }}
        onCancel={() => setConfirmando(null)}
      />

      <ConfirmDialog
        open={confirmando === "excluir"}
        title={`Excluir ${conta.nome_negocio}?`}
        description="Isso apaga a conta e tudo que ela tem: clientes, vendas, agenda e conversas. Não dá para desfazer nem recuperar depois."
        confirmLabel="Excluir para sempre"
        exigirTexto={conta.nome_negocio}
        exigirTextoRotulo={`Digite “${conta.nome_negocio}” para confirmar`}
        onConfirm={() => {
          setConfirmando(null);
          excluir();
        }}
        onCancel={() => setConfirmando(null)}
      />
    </article>
  );
}
