"use client";

import { useState } from "react";
import {
  BellRing,
  Check,
  ChevronDown,
  Clock3,
  Plus,
  Stamp,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FRENTES } from "@/lib/posto/cargos";
import type { NovaPendencia } from "@/hooks/usePosto";
import type {
  Database,
  FrentePosto,
  TipoPendencia,
} from "@/types/database";
import { cn } from "@/lib/utils";

/*
 * A mesma pintura de campo do components/ui/Input.tsx, aplicada a um <input>
 * solto. O componente exige `label` visível, e aqui o rótulo seria ruído: o
 * campo de anotar fica embaixo do título da seção, que já diz o que ele é.
 */
const CAMPO =
  "w-full min-w-0 rounded-button border border-neutro-border bg-escuro/[0.04] px-3.5 py-3 text-base text-escuro placeholder:text-neutro-muted md:text-sm outline-none transition-colors focus:border-primary-forte focus:bg-escuro/[0.08]";

type Pendencia = Database["public"]["Tables"]["posto_pendencias"]["Row"];

/**
 * A memória dela.
 *
 * Quatro tipos numa lista só, e não quatro listas: a pergunta que ela faz é "o
 * que está em aberto", não "quais são minhas esperas". O tipo vira ÍCONE, que
 * é o bastante para separar o que ela faz do que ela cobra, do que ela espera e
 * do que depende do gerente.
 *
 * O formulário é uma linha: título e pronto. Frente, tipo, prazo e com quem
 * ficam atrás de "mais detalhes". Pendência que custa seis campos para nascer
 * não é anotada no meio de um disparo — e a que não é anotada é exatamente a
 * que ela vai esquecer.
 */

const ICONE: Record<TipoPendencia, typeof Check> = {
  tarefa: Check,
  cobranca: BellRing,
  espera: Clock3,
  aprovacao: Stamp,
};

const ROTULO_TIPO: Record<TipoPendencia, string> = {
  tarefa: "Eu faço",
  cobranca: "Eu cobro",
  espera: "Estou esperando",
  aprovacao: "Depende do Dyego",
};

export function Pendencias({
  pendencias,
  onCriar,
  onFechar,
}: {
  pendencias: Pendencia[];
  onCriar: (nova: NovaPendencia) => Promise<boolean>;
  onFechar: (id: string) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [frente, setFrente] = useState<FrentePosto>("assistencia");
  const [tipo, setTipo] = useState<TipoPendencia>("tarefa");
  const [comQuem, setComQuem] = useState("");
  const [prazo, setPrazo] = useState("");
  const [urgente, setUrgente] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function criar() {
    const limpo = titulo.trim();
    if (!limpo) return;
    setSalvando(true);
    const ok = await onCriar({
      titulo: limpo,
      frente,
      tipo,
      comQuem: comQuem.trim() || null,
      prazo: prazo || null,
      urgente,
    });
    setSalvando(false);
    if (!ok) return;
    // Zera só o que é daquela pendência. Frente e tipo ficam: quem anota três
    // cobranças seguidas não quer reescolher "cobrança" três vezes.
    setTitulo("");
    setComQuem("");
    setPrazo("");
    setUrgente(false);
  }

  return (
    <section className="vidro-card rounded-[20px] p-5">
      <header className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-escuro">O que está em aberto</h2>
        <p className="text-[13px] text-neutro-muted">{pendencias.length}</p>
      </header>

      <div className="flex gap-2">
        <input
          className={CAMPO}
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") criar();
          }}
          placeholder="Anotar agora e esquecer depois…"
          aria-label="O que precisa ser lembrado"
        />
        <Button
          onClick={criar}
          disabled={!titulo.trim() || salvando}
          aria-label="Adicionar"
          className="shrink-0"
        >
          <Plus className="size-5" />
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="mt-2 flex items-center gap-1 text-[13px] font-semibold text-primary-forte"
      >
        <ChevronDown
          className={cn("size-4 transition", aberto && "rotate-180")}
        />
        {aberto ? "Menos detalhes" : "Mais detalhes"}
      </button>

      {aberto && (
        <div className="mt-3 space-y-3 rounded-card border border-neutro-border p-3">
          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-neutro-muted">
              Qual frente
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FRENTES.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFrente(f.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[13px] font-semibold transition",
                    frente === f.id
                      ? "bg-primary text-primary-text"
                      : "border border-neutro-border text-escuro",
                  )}
                >
                  {f.nome.split(" — ")[0]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[13px] font-semibold text-neutro-muted">
              O que é
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ROTULO_TIPO) as TipoPendencia[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[13px] font-semibold transition",
                    tipo === t
                      ? "bg-primary text-primary-text"
                      : "border border-neutro-border text-escuro",
                  )}
                >
                  {ROTULO_TIPO[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              className={cn(CAMPO, "flex-1")}
              value={comQuem}
              onChange={(e) => setComQuem(e.target.value)}
              placeholder="Com quem (executivo, cliente, Dyego…)"
              aria-label="Com quem"
            />
            <input
              type="date"
              className={cn(CAMPO, "max-w-[9.5rem]")}
              value={prazo}
              onChange={(e) => setPrazo(e.target.value)}
              aria-label="Prazo"
            />
          </div>

          <label className="flex items-center gap-2 text-[14px] font-semibold text-escuro">
            <input
              type="checkbox"
              checked={urgente}
              onChange={(e) => setUrgente(e.target.checked)}
              className="size-4 accent-[rgb(var(--primary))]"
            />
            É lead novo ou urgente — passa na frente
          </label>
        </div>
      )}

      {pendencias.length === 0 ? (
        <p className="mt-4 text-sm text-neutro-muted">
          Nada em aberto. O que você lembrar no meio de outra coisa, joga aqui.
        </p>
      ) : (
        <ul className="mt-4 space-y-1">
          {pendencias.map((p) => {
            const Icone = ICONE[p.tipo];
            return (
              <li
                key={p.id}
                className={cn(
                  "flex items-start gap-2.5 rounded-card px-2 py-2",
                  p.urgente && "bg-ambar-light/60",
                )}
              >
                <Icone
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    p.tipo === "aprovacao"
                      ? "text-ambar-texto"
                      : "text-neutro-muted",
                  )}
                  aria-label={ROTULO_TIPO[p.tipo]}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold leading-snug text-escuro">
                    {p.titulo}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-2 text-[12px] text-neutro-muted">
                    <span>{ROTULO_TIPO[p.tipo]}</span>
                    {p.com_quem && (
                      <span className="flex items-center gap-1">
                        <UserRound className="size-3" />
                        {p.com_quem}
                      </span>
                    )}
                    {p.prazo && <span>até {formatarPrazo(p.prazo)}</span>}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onFechar(p.id)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full border border-neutro-border text-escuro transition active:scale-95"
                  aria-label={`Concluir "${p.titulo}"`}
                >
                  <Check className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * Prazo em dia/mês, sem `new Date(p.prazo)`.
 *
 * `new Date("2026-10-14")` é interpretado como MEIA-NOITE EM UTC, que em
 * Brasília é dia 13 às 21h — o prazo apareceria um dia antes do que é. Partir a
 * string é mais simples e não erra.
 */
function formatarPrazo(prazo: string): string {
  const [, mes, dia] = prazo.split("-");
  return `${dia}/${mes}`;
}
