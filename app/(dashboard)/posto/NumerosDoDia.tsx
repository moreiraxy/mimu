"use client";

import { useState } from "react";
import { Check, Minus, TrendingDown, TrendingUp } from "lucide-react";
import {
  bateuAMeta,
  formatarValor,
  NUMEROS,
  type NumeroDoCargo,
} from "@/lib/posto/numeros";
import { cn } from "@/lib/utils";

/**
 * Os seis números pelos quais ela é medida, anotáveis em um toque.
 *
 * Por que anotação à mão, e não leitura automática do CRM: estes números vivem
 * no CRM Fortis, que é outro sistema, com outro banco. Esperar a integração
 * para ter a tela seria entregar nada hoje. Quando a integração existir, a
 * tabela `posto_numeros` continua a mesma — muda só quem escreve nela.
 *
 * A diferença entre "não anotado" e "zero" é levada a sério aqui: zero em
 * "e-mails pendentes" é a meta batida; não anotado é pendência. Pintar os dois
 * iguais faria a tela parabenizar o esquecimento.
 */
export function NumerosDoDia({
  valores,
  onAnotar,
}: {
  valores: Record<string, number>;
  onAnotar: (chave: string, valor: number) => void;
}) {
  return (
    <section className="vidro-card rounded-[20px] p-5">
      <header className="mb-1">
        <h2 className="text-lg font-bold text-escuro">Os seus números</h2>
        <p className="text-[13px] text-neutro-muted">
          Do documento de funções — é por eles que a gerência te mede.
        </p>
      </header>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {NUMEROS.map((numero) => (
          <LinhaDoNumero
            key={numero.chave}
            numero={numero}
            valor={valores[numero.chave]}
            onAnotar={onAnotar}
          />
        ))}
      </div>
    </section>
  );
}

function LinhaDoNumero({
  numero,
  valor,
  onAnotar,
}: {
  numero: NumeroDoCargo;
  valor: number | undefined;
  onAnotar: (chave: string, valor: number) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(valor !== undefined ? String(valor) : "");
  const status = bateuAMeta(numero, valor);

  function salvar() {
    const n = Number(texto.replace(",", "."));
    setEditando(false);
    if (!Number.isFinite(n)) return;
    onAnotar(numero.chave, n);
  }

  const Seta =
    status === null ? Minus : numero.direcao === "menor_melhor" ? TrendingDown : TrendingUp;

  return (
    <div
      className={cn(
        "rounded-card border p-3",
        status === true && "border-verde-light bg-verde-light/40",
        status === false && "border-ambar-soft bg-ambar-light/40",
        status === null && "border-neutro-border",
      )}
    >
      <p className="text-[13px] font-semibold leading-snug text-escuro">
        {numero.label}
      </p>
      <p className="mt-0.5 text-[12px] text-neutro-muted">
        meta: {numero.metaTexto}
        {numero.periodicidade === "semanal" && " · na semana"}
        {numero.periodicidade === "por_disparo" && " · por disparo"}
      </p>

      {editando ? (
        <div className="mt-2 flex gap-1.5">
          <input
            autoFocus
            inputMode="decimal"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") salvar();
              if (e.key === "Escape") setEditando(false);
            }}
            className="w-full min-w-0 rounded-button border border-primary-forte bg-escuro/[0.08] px-2.5 py-1.5 text-base text-escuro outline-none md:text-sm"
            aria-label={`Valor de ${numero.label}`}
          />
          <button
            type="button"
            onClick={salvar}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-text"
            aria-label="Salvar"
          >
            <Check className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setTexto(valor !== undefined ? String(valor) : "");
            setEditando(true);
          }}
          className="mt-2 flex w-full items-baseline justify-between gap-2 text-left"
        >
          <span
            className={cn(
              "text-2xl font-bold",
              valor === undefined ? "text-neutro-muted" : "text-escuro",
            )}
          >
            {valor === undefined ? "—" : formatarValor(numero, valor)}
          </span>
          <Seta
            className={cn(
              "size-4 shrink-0",
              status === true && "text-verde-texto",
              status === false && "text-ambar-texto",
              status === null && "text-neutro-muted",
            )}
          />
        </button>
      )}

      {valor === undefined && (
        <p className="mt-1 text-[12px] text-neutro-muted">
          Ainda não anotado hoje.
        </p>
      )}
    </div>
  );
}
