"use client";

import { useMemo, useState } from "react";
import { MessageCircle, Phone, Plus, Search, Trash2 } from "lucide-react";
import { useClientes } from "@/hooks/useClientes";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatarTelefoneBR } from "@/lib/formatters";
import { BLOCO, HORA, LINHA, ROTULO } from "../posto/estilos";
import { cn } from "@/lib/utils";
import type { Cliente } from "@/types";

/**
 * LEADS — o que a tela de "Clientes" virou.
 *
 * O que estava ali era de salão, e ela viu na hora: "clientes fiados?? clientes??".
 * A tela tinha filtro de "Clientes Fiéis" e "Com fiado", selo de fidelidade por
 * dez visitas, total gasto e saldo de fiado. Nada disso existe no trabalho dela:
 * quem aparece aqui é gente que respondeu um disparo ou entrou pela marca, e o
 * que ela precisa saber é telefone, o que já conversaram e quando foi a última
 * vez.
 *
 * MESMA TABELA, OUTRA PERGUNTA. Continua sendo `clientes` no banco — é onde a
 * agenda guarda com quem é o compromisso, e inventar tabela nova faria o campo
 * "com quem" apontar para o vazio. O que mudou é o que a tela mostra e o que
 * ela deixa fazer.
 *
 * E DÁ PARA APAGAR. Não dava, em lugar nenhum do app: "e eu n posso APAGAR??
 * loucura isso". O histórico não vai embora com a pessoa — agendamento e
 * transação ficam, sem dono, porque lançamento de caixa não pode desaparecer
 * porque alguém limpou um cadastro (ver `excluir` em hooks/useClientes.ts).
 *
 * "Falei hoje" grava a data do último contato com um toque. É o gesto que ela
 * repete o dia inteiro na ativação de base — e sem ele a data envelhece sozinha
 * e a lista deixa de dizer quem está esfriando.
 */
export default function LeadsPage() {
  const { clientes, loading, excluir, adicionar, marcarContatoHoje } =
    useClientes();
  const { showToast } = useToast();
  const [busca, setBusca] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [paraApagar, setParaApagar] = useState<Cliente | null>(null);
  const [salvando, setSalvando] = useState(false);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrada = termo
      ? clientes.filter(
          (c) =>
            c.nome.toLowerCase().includes(termo) ||
            (c.telefone ?? "").includes(termo),
        )
      : clientes;
    // Quem falou há mais tempo primeiro: é a ordem da ativação de base, que
    // trabalha justamente quem está parado. Sem contato nenhum vem antes de
    // todos — nunca foi falado.
    return [...filtrada].sort((a, b) =>
      (a.ultimo_atendimento ?? "").localeCompare(b.ultimo_atendimento ?? ""),
    );
  }, [clientes, busca]);

  async function criarLead() {
    const nome = novoNome.trim();
    if (!nome) return;
    setSalvando(true);
    const ok = await adicionar(nome, novoTelefone);
    setSalvando(false);
    if (!ok) {
      showToast("Não consegui adicionar.");
      return;
    }
    setNovoNome("");
    setNovoTelefone("");
  }

  async function marcarFalei(lead: Cliente) {
    const ok = await marcarContatoHoje(lead.id);
    if (!ok) showToast("Não consegui marcar.");
  }

  const CAMPO =
    "w-full min-w-0 rounded-button border border-neutro-border bg-escuro/[0.04] px-3 py-2.5 text-base text-escuro placeholder:text-neutro-muted md:text-sm outline-none transition-colors focus:border-primary-forte focus:bg-escuro/[0.08]";

  return (
    <div className="lg:mx-auto lg:max-w-5xl">
      <PageHeader title="Leads" voltar={false} />

      <div className="flex flex-col gap-4">
        <section className={BLOCO}>
          <p className={cn("mb-2 block", ROTULO)}>Novo lead</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className={CAMPO}
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Nome"
              aria-label="Nome do lead"
            />
            <input
              className={cn(CAMPO, "sm:max-w-[11rem]")}
              value={novoTelefone}
              onChange={(e) => setNovoTelefone(e.target.value)}
              placeholder="Telefone"
              inputMode="tel"
              aria-label="Telefone"
            />
            <button
              type="button"
              onClick={criarLead}
              disabled={!novoNome.trim() || salvando}
              className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-button bg-primary px-4 text-[14px] font-bold text-primary-text disabled:opacity-50"
            >
              <Plus className="size-4" /> Adicionar
            </button>
          </div>
        </section>

        <section className={BLOCO}>
          <header className="mb-2 flex items-center justify-between gap-2">
            <p className={ROTULO}>
              {lista.length} {lista.length === 1 ? "lead" : "leads"}
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-neutro-muted" />
              <input
                className={cn(CAMPO, "max-w-[12rem] py-1.5 pl-7 text-[13px]")}
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar"
                aria-label="Buscar lead"
              />
            </div>
          </header>

          {loading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
          ) : lista.length === 0 ? (
            <p className="py-3 text-[13px] text-neutro-muted">
              {busca ? "Nada com esse termo." : "Nenhum lead ainda."}
            </p>
          ) : (
            <ul>
              {lista.map((lead) => (
                <li key={lead.id} className={LINHA}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-escuro">
                      {lead.nome}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2 text-[12px] text-neutro-muted">
                      {lead.telefone && (
                        <span>{formatarTelefoneBR(lead.telefone)}</span>
                      )}
                      <span className={HORA}>
                        {lead.ultimo_atendimento
                          ? `falado em ${formatarDia(lead.ultimo_atendimento)}`
                          : "nunca falado"}
                      </span>
                    </p>
                  </div>

                  {lead.telefone && (
                    <a
                      href={`https://wa.me/55${lead.telefone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-neutro-border text-escuro"
                      aria-label={`Abrir WhatsApp de ${lead.nome}`}
                    >
                      <MessageCircle className="size-4" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => marcarFalei(lead)}
                    className="flex h-8 shrink-0 items-center gap-1 rounded-full border border-neutro-border px-2.5 text-[12px] font-bold text-escuro"
                  >
                    <Phone className="size-3.5" /> Falei hoje
                  </button>

                  <button
                    type="button"
                    onClick={() => setParaApagar(lead)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutro-muted hover:text-erro-texto"
                    aria-label={`Apagar ${lead.nome}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={paraApagar !== null}
        title={`Apagar ${paraApagar?.nome ?? ""}?`}
        description="Isto não tem volta. Agendamentos e lançamentos financeiros desta pessoa continuam no histórico, sem dono."
        confirmLabel="Apagar"
        onCancel={() => setParaApagar(null)}
        onConfirm={async () => {
          const alvo = paraApagar;
          setParaApagar(null);
          if (!alvo) return;
          const ok = await excluir(alvo.id);
          showToast(ok ? "Apagado." : "Não consegui apagar.");
        }}
      />
    </div>
  );
}

/**
 * Dia/mês a partir de uma coluna `date`, sem `new Date(valor)`.
 *
 * `new Date("2026-10-14")` é meia-noite em UTC, que em Brasília é dia 13 às
 * 21h — a data apareceria um dia antes do que é.
 */
function formatarDia(iso: string): string {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
}
