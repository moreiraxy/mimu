"use client";

import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { formatTime } from "@/lib/formatters";
import type { AgendamentoComCliente, StatusAgendamento } from "@/types";
import { cn } from "@/lib/utils";

/**
 * Os compromissos de hoje e de amanhã, dentro do posto.
 *
 * Ela pediu o calendário de volta duas vezes no mesmo dia: primeiro porque o
 * posto expulsou a Agenda da barra de baixo, depois porque reunião e bloco de
 * horário são o mesmo dia e estavam em telas diferentes. Uma pessoa que
 * confirma reunião na véspera e remarca pelo gerente não pode trocar de tela
 * para saber se às 15h ela está livre.
 *
 * AMANHÃ ENTRA JUNTO, e é o ponto deste cartão. O bloco de burocracia das 15h
 * às 17h inclui "confirmar reunião da véspera" — confirmar o de amanhã é
 * trabalho de HOJE, e um cartão que mostrasse só hoje esconderia exatamente o
 * que esse bloco cobra.
 */

const COR_STATUS: Record<StatusAgendamento, string> = {
  confirmado: "bg-verde",
  pendente: "bg-ambar",
  concluido: "bg-neutro-icon",
  nao_compareceu: "bg-erro",
};

export function CompromissosCard({
  hoje,
  amanha,
}: {
  hoje: AgendamentoComCliente[];
  amanha: AgendamentoComCliente[];
}) {
  return (
    <section className="vidro-card rounded-[20px] p-5">
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold text-escuro">
          <CalendarDays className="size-4 text-primary-forte" /> Compromissos
        </h2>
        <Link
          href="/agenda"
          className="text-[13px] font-bold text-primary-forte"
        >
          Calendário →
        </Link>
      </header>

      <Dia titulo="Hoje" itens={hoje} vazio="Nada marcado hoje." />
      {amanha.length > 0 && (
        <div className="mt-3 border-t border-neutro-border pt-3">
          <Dia titulo="Amanhã" itens={amanha} vazio="" />
        </div>
      )}
    </section>
  );
}

function Dia({
  titulo,
  itens,
  vazio,
}: {
  titulo: string;
  itens: AgendamentoComCliente[];
  vazio: string;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-neutro-muted">
        {titulo}
      </p>
      {itens.length === 0 ? (
        <Link href="/agenda/novo" className="text-[13px] text-neutro-muted">
          {vazio} Marcar →
        </Link>
      ) : (
        <ul className="space-y-1.5">
          {itens.map((item) => (
            <li key={item.id}>
              <Link
                href={`/agenda/${item.id}`}
                className="flex items-center gap-2.5"
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    COR_STATUS[item.status],
                  )}
                />
                <span className="font-mono text-[13px] text-neutro-muted">
                  {formatTime(item.data_hora)}
                </span>
                <span className="min-w-0 flex-1 truncate text-[14px] text-escuro">
                  {item.titulo}
                  {item.cliente?.nome ? ` · ${item.cliente.nome}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
