"use client";

import { useState } from "react";
import { ChevronDown, FileWarning, ShieldCheck, Stamp } from "lucide-react";
import {
  FRENTES,
  JORNADA_ACORDADA,
  PRECISA_DO_GERENTE,
  RESOLVE_SOZINHA,
} from "@/lib/posto/cargos";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";
import { BLOCO, ROTULO } from "./estilos";

type Pendencia = Database["public"]["Tables"]["posto_pendencias"]["Row"];

/**
 * Os cinco cargos, e qual deles está no papel.
 *
 * O selo "fora do papel" é o ponto desta seção, e não enfeite: três das cinco
 * frentes não existem em documento nenhum, e o único documento que existe
 * descreve a de menor alcance — que é justamente a medida por seis indicadores
 * diários. Uma tela que mostrasse as cinco como iguais esconderia essa conta.
 *
 * Também mostra o limite da autonomia (itens 3.8 e 3.9 do documento). Está
 * aqui porque é a consulta mais barata de errar: responder em nome do gerente
 * algo que precisava dele é o tipo de coisa que não se desfaz.
 */
export function FrentesCard({ pendencias }: { pendencias: Pendencia[] }) {
  const [aberta, setAberta] = useState<string | null>(null);

  const abertasPorFrente = pendencias.reduce<Record<string, number>>(
    (acc, p) => ({ ...acc, [p.frente]: (acc[p.frente] ?? 0) + 1 }),
    {},
  );

  return (
    <section className={BLOCO}>
      <header className="mb-1">
        <h2 className={cn("", ROTULO)}>Os seus cinco cargos</h2>
        <p className="text-[13px] text-neutro-muted">
          {JORNADA_ACORDADA.dias}, {JORNADA_ACORDADA.inicio} às{" "}
          {JORNADA_ACORDADA.fim} — o horário que o papel prevê para um deles.
        </p>
      </header>

      <ul className="mt-4 space-y-1.5">
        {FRENTES.map((frente) => {
          const estaAberta = aberta === frente.id;
          const emAberto = abertasPorFrente[frente.id] ?? 0;
          return (
            <li
              key={frente.id}
              className="rounded-card border border-neutro-border"
            >
              <button
                type="button"
                onClick={() => setAberta(estaAberta ? null : frente.id)}
                aria-expanded={estaAberta}
                className="flex w-full items-start gap-2.5 p-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-bold text-escuro">
                      {frente.nome}
                    </span>
                    {!frente.noPapel && (
                      <span className="flex items-center gap-1 rounded-full bg-ambar-light px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ambar-texto">
                        <FileWarning className="size-3" /> fora do papel
                      </span>
                    )}
                    {emAberto > 0 && (
                      <span className="rounded-full bg-primary-light px-2 py-0.5 text-[11px] font-bold text-primary-forte">
                        {emAberto} em aberto
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-neutro-muted">
                    {frente.contexto}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "mt-1 size-4 shrink-0 text-neutro-muted transition",
                    estaAberta && "rotate-180",
                  )}
                />
              </button>

              {estaAberta && (
                <div className="border-t border-neutro-border p-3">
                  <p className="text-[13px] italic text-neutro-muted">
                    {frente.notaDoPapel}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {frente.responsabilidades.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-[14px] leading-snug text-escuro"
                      >
                        <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary-forte" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-card border border-neutro-border p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-escuro">
            <ShieldCheck className="size-4 text-verde-texto" /> Você resolve
            sozinha
          </p>
          <ul className="mt-2 space-y-1">
            {RESOLVE_SOZINHA.map((item) => (
              <li key={item} className="text-[13px] leading-snug text-neutro-muted">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-card border border-ambar-soft bg-ambar-light/30 p-3">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-escuro">
            <Stamp className="size-4 text-ambar-texto" /> Precisa do Dyego
          </p>
          <ul className="mt-2 space-y-1">
            {PRECISA_DO_GERENTE.map((item) => (
              <li key={item} className="text-[13px] leading-snug text-neutro-muted">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
