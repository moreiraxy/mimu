"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { PLANOS, type PlanoPago, type Periodicidade } from "@/lib/planos";
import { formatCurrency } from "@/lib/formatters";

/**
 * Registrar uma venda feita fora de qualquer plataforma.
 *
 * Boa parte da venda no começo acontece por fora: conversa no WhatsApp, Pix
 * direto, combinado pessoalmente. Sem isto, liberar o acesso exigia mexer no
 * banco a cada venda.
 *
 * O valor NÃO é um campo. Ele sai da tabela de planos no servidor e aparece
 * aqui só para conferência: valor digitado à mão entra torto no relatório de
 * receita, e ninguém percebe até fechar o mês.
 */
const PERIODICIDADES: { id: Periodicidade; label: string }[] = [
  { id: "mensal", label: "Mensal" },
  { id: "anual", label: "Anual" },
];

export function VendaManualSection({ onRegistrada }: { onRegistrada: () => void }) {
  const [aberto, setAberto] = useState(false);
  const [email, setEmail] = useState("");
  const [nomeNegocio, setNomeNegocio] = useState("");
  const [plano, setPlano] = useState<PlanoPago>("pro");
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("mensal");
  const [referencia, setReferencia] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const valor = periodicidade === "anual"
    ? PLANOS[plano].valorAnual
    : PLANOS[plano].valorMensal;

  async function registrar() {
    setEnviando(true);
    setErro(null);
    setResultado(null);

    const r = await fetch("/api/admin/vendas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nomeNegocio, plano, periodicidade, referencia }),
    });
    const dados = await r.json().catch(() => ({}));
    setEnviando(false);

    if (!r.ok) {
      setErro(dados.error ?? "Não consegui registrar.");
      return;
    }

    setResultado(
      dados.jaProcessado
        ? "Essa venda já estava registrada. Nada foi duplicado."
        : dados.contaNova
          ? dados.emailEnviado
            ? `Conta criada e liberada. ${email} recebeu o e-mail para definir a senha.`
            : // O envio falhou, e dizer que saiu deixaria a pessoa esperando um
              // e-mail que não existe. A saída manual é dita aqui porque é a que
              // funciona sem depender de mais nada.
              `Conta criada e liberada, mas o e-mail não saiu. Avise ${email} para entrar com "esqueci minha senha".`
          : "Conta já existia e foi liberada. A senha continua a mesma.",
    );
    setEmail("");
    setNomeNegocio("");
    setReferencia("");
    onRegistrada();
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mb-8 flex items-center gap-2 rounded-button border border-neutro-border bg-superficie px-4 py-2.5 text-sm font-semibold text-escuro transition-colors hover:bg-fundo"
      >
        <Plus className="h-4 w-4" strokeWidth={2.25} />
        Registrar venda feita por fora
      </button>
    );
  }

  return (
    <section className="mb-8 rounded-card border border-neutro-border bg-superficie p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold text-escuro">
          Venda feita por fora
        </h2>
        <button
          type="button"
          onClick={() => setAberto(false)}
          aria-label="Fechar"
          className="text-neutro-muted transition-colors hover:text-escuro"
        >
          <X className="h-4 w-4" strokeWidth={2.25} />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-neutro-muted">E-mail de quem comprou</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@email.com"
            className="rounded-button border border-neutro-border bg-fundo px-3 py-2.5 text-sm text-escuro"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs text-neutro-muted">Nome do negócio</span>
          <input
            value={nomeNegocio}
            onChange={(e) => setNomeNegocio(e.target.value)}
            placeholder="Studio Bela Rosa"
            className="rounded-button border border-neutro-border bg-fundo px-3 py-2.5 text-sm text-escuro"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(Object.keys(PLANOS) as PlanoPago[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPlano(p)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              plano === p
                ? "bg-primary text-primary-text"
                : "border border-neutro-border text-neutro-muted-strong"
            }`}
          >
            {PLANOS[p].nome}
          </button>
        ))}
        <span className="w-full sm:w-auto" />
        {PERIODICIDADES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriodicidade(p.id)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              periodicidade === p.id
                ? "bg-primary text-primary-text"
                : "border border-neutro-border text-neutro-muted-strong"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <label className="mt-4 flex flex-col gap-1.5">
        <span className="text-xs text-neutro-muted">
          Referência do pagamento (opcional, evita registrar duas vezes)
        </span>
        <input
          value={referencia}
          onChange={(e) => setReferencia(e.target.value)}
          placeholder="id do Pix, ou o que te ajude a lembrar"
          className="rounded-button border border-neutro-border bg-fundo px-3 py-2.5 text-sm text-escuro"
        />
      </label>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {/* O valor vem do servidor, aqui é só conferência. */}
        <p className="text-sm text-neutro-muted">
          {valor === null ? (
            <span className="text-erro-texto">
              {PLANOS[plano].nome} não tem preço anual definido.
            </span>
          ) : (
            <>
              Vai registrar{" "}
              <strong className="text-escuro">{formatCurrency(valor)}</strong>
              {periodicidade === "anual" ? " pelo ano" : " pelo mês"}
            </>
          )}
        </p>

        <button
          type="button"
          onClick={registrar}
          disabled={enviando || !email.includes("@") || valor === null}
          className="rounded-button bg-primary px-4 py-2.5 text-sm font-bold text-primary-text transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {enviando ? "Registrando..." : "Liberar acesso"}
        </button>
      </div>

      {erro && (
        <p className="mt-3 rounded-button bg-erro-light px-3 py-2 text-sm text-erro-texto">
          {erro}
        </p>
      )}
      {resultado && (
        <p className="mt-3 rounded-button bg-verde-light px-3 py-2 text-sm text-verde-texto">
          {resultado}
        </p>
      )}
    </section>
  );
}
