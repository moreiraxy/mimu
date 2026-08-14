"use client";

import { useMemo, useState } from "react";
import { cn, paraISOLocal } from "@/lib/utils";

const DIAS_SEMANA = ["S", "T", "Q", "Q", "S", "S", "D"];

function gerarGrade(mesVisivel: Date): (Date | null)[] {
  const ano = mesVisivel.getFullYear();
  const mes = mesVisivel.getMonth();
  const primeiroDia = new Date(ano, mes, 1);
  // getDay(): 0=dom..6=sáb. Semana começando na segunda-feira.
  const offset = (primeiroDia.getDay() + 6) % 7;
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();

  const celulas: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) celulas.push(null);
  for (let dia = 1; dia <= diasNoMes; dia++) celulas.push(new Date(ano, mes, dia));
  while (celulas.length % 7 !== 0) celulas.push(null);
  return celulas;
}

export function CalendarioInline({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataISO: string) => void;
}) {
  const selecionada = new Date(`${value}T00:00:00`);
  const [mesVisivel, setMesVisivel] = useState(
    new Date(selecionada.getFullYear(), selecionada.getMonth(), 1),
  );
  const celulas = useMemo(() => gerarGrade(mesVisivel), [mesVisivel]);
  const hojeISO = paraISOLocal(new Date());
  const nomeMes = mesVisivel.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Mês anterior"
          onClick={() =>
            setMesVisivel(
              new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() - 1, 1),
            )
          }
          className="flex h-8 w-8 items-center justify-center rounded-full text-escuro hover:bg-fundo"
        >
          ‹
        </button>
        <p className="text-sm font-semibold capitalize text-escuro">
          {nomeMes}
        </p>
        <button
          type="button"
          aria-label="Próximo mês"
          onClick={() =>
            setMesVisivel(
              new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + 1, 1),
            )
          }
          className="flex h-8 w-8 items-center justify-center rounded-full text-escuro hover:bg-fundo"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {DIAS_SEMANA.map((letra, i) => (
          <span
            key={i}
            className="text-[10px] font-semibold text-neutro-muted"
          >
            {letra}
          </span>
        ))}
        {celulas.map((dia, i) => {
          if (!dia) return <span key={i} />;
          const iso = paraISOLocal(dia);
          const selecionado = iso === value;
          const hoje = iso === hojeISO;
          return (
            <button
              type="button"
              key={i}
              onClick={() => onChange(iso)}
              className={cn(
                "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                selecionado
                  ? "bg-primary text-primary-text"
                  : hoje
                    ? "border border-primary-forte text-primary-forte"
                    : "text-escuro hover:bg-fundo",
              )}
            >
              {dia.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
