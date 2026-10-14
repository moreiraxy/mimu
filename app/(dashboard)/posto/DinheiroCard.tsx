"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";
import { Valor } from "@/components/Valor";
import { fontesComZeros, type ResumoDoDinheiro } from "@/lib/posto/financas";
import { cn } from "@/lib/utils";

/**
 * O dinheiro dela no mês, por fonte e por destino.
 *
 * Os lançamentos continuam acontecendo no Financeiro, que já existe e já faz
 * isso bem — este cartão é a resposta, não o formulário. Os dois botões levam
 * direto para as telas de nova entrada e nova saída.
 *
 * "SOBROU" E NÃO "SALDO". Isto é entrada menos saída DO MÊS, não o saldo da
 * conta dela. Chamar de saldo foi o defeito corrigido em 10/09/2026, quando a
 * Mimu dizia R$ 1.056,00 e o Financeiro, na tela ao lado, mostrava
 * R$ 20.531,00: os dois números certos, o rótulo mentindo. O mesmo erro não
 * volta por aqui.
 *
 * As fontes que ficaram em zero APARECEM, e isso é escolha: "R$ 0,00 do Dyego
 * este mês" é informação — uma lista montada só do que foi lançado jamais
 * mostraria o que não entrou.
 */
export function DinheiroCard({ resumo }: { resumo: ResumoDoDinheiro }) {
  const fontes = fontesComZeros(resumo.porFonte);
  const destinos = resumo.porDestino.slice(0, 6);

  return (
    <section className="vidro-card rounded-[20px] p-5">
      <header className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-escuro">Seu dinheiro no mês</h2>
        <p className="text-[13px] text-neutro-muted">
          {resumo.lancamentos}{" "}
          {resumo.lancamentos === 1 ? "lançamento" : "lançamentos"}
        </p>
      </header>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-card border border-neutro-border p-3">
          <p className="text-[12px] font-semibold text-neutro-muted">Entrou</p>
          <Valor valor={resumo.entrou} className="text-lg font-bold text-escuro" />
        </div>
        <div className="rounded-card border border-neutro-border p-3">
          <p className="text-[12px] font-semibold text-neutro-muted">Saiu</p>
          <Valor valor={resumo.saiu} className="text-lg font-bold text-escuro" />
        </div>
        <div
          className={cn(
            "rounded-card border p-3",
            resumo.sobrou >= 0
              ? "border-verde-light bg-verde-light/40"
              : "border-ambar-soft bg-ambar-light/40",
          )}
        >
          <p className="text-[12px] font-semibold text-neutro-muted">Sobrou</p>
          <Valor
            valor={resumo.sobrou}
            className={cn(
              "text-lg font-bold",
              resumo.sobrou >= 0 ? "text-verde-texto" : "text-ambar-texto",
            )}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Coluna
          titulo="De onde veio"
          linhas={fontes}
          total={resumo.entrou}
          tom="entrada"
        />
        <Coluna
          titulo="Para onde foi"
          linhas={destinos}
          total={resumo.saiu}
          tom="saida"
          vazio="Nenhuma saída lançada neste mês."
        />
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href="/financeiro/nova-entrada"
          className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-button bg-primary text-[15px] font-bold text-primary-text transition active:scale-[0.97]"
        >
          <ArrowUpRight className="size-4" /> Entrou dinheiro
        </Link>
        <Link
          href="/financeiro/nova-saida"
          className="vidro-card flex h-11 flex-1 items-center justify-center gap-1.5 rounded-button text-[15px] font-bold text-escuro transition active:scale-[0.97]"
        >
          <ArrowDownRight className="size-4" /> Gastei
        </Link>
      </div>
    </section>
  );
}

function Coluna({
  titulo,
  linhas,
  total,
  tom,
  vazio,
}: {
  titulo: string;
  linhas: { rotulo: string; valor: number; fatia: number }[];
  total: number;
  tom: "entrada" | "saida";
  vazio?: string;
}) {
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold uppercase tracking-wide text-neutro-muted">
        {titulo}
      </p>
      {linhas.length === 0 ? (
        <p className="text-[13px] text-neutro-muted">
          {vazio ?? "Nada lançado ainda."}
        </p>
      ) : (
        <ul className="space-y-2">
          {linhas.map((linha) => (
            <li key={linha.rotulo}>
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "truncate text-[14px]",
                    linha.valor === 0
                      ? "text-neutro-muted"
                      : "font-semibold text-escuro",
                  )}
                >
                  {linha.rotulo}
                </span>
                <Valor
                  valor={linha.valor}
                  className={cn(
                    "shrink-0 text-[14px]",
                    linha.valor === 0 ? "text-neutro-muted" : "text-escuro",
                  )}
                />
              </div>
              {/* A barra é relativa ao total daquela coluna, nunca ao total
                  geral: comparar fatia de entrada com fatia de saída na mesma
                  régua não responde pergunta nenhuma. */}
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-escuro/[0.06]">
                <div
                  className={cn(
                    "h-full rounded-full",
                    tom === "entrada" ? "bg-primary" : "bg-ambar",
                  )}
                  style={{
                    width: `${total > 0 ? Math.round(linha.fatia * 100) : 0}%`,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
