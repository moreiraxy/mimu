"use client";

import { useMemo } from "react";
import { paraISOLocal } from "@/lib/utils";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { Skeleton } from "@/components/ui/Skeleton";
import { GradeDeHorario } from "./GradeDeHorario";

function inicioDaSemana(referencia: Date): Date {
  const dia = new Date(referencia);
  const offset = (dia.getDay() + 6) % 7; // 0 = segunda
  dia.setDate(dia.getDate() - offset);
  dia.setHours(0, 0, 0, 0);
  return dia;
}

/**
 * A semana no formato do Google Agenda: sete colunas sobre a régua das horas.
 *
 * O QUE ESTAVA AQUI ANTES eram duas coisas empilhadas — uma fita de sete
 * botões com bolinhas e, embaixo, a lista dos agendamentos agrupados por dia.
 * Ela respondia "quantos" e nunca "quando": para saber se a quarta às 15h
 * estava livre era preciso tocar na quarta, trocar de visão e ler a lista.
 *
 * Palavras dela: "a agenda deve ser igual ao sistema do google agendas, e a
 * visualização tb". A grade responde a pergunta inteira de uma vez, porque o
 * VAZIO tem altura — e é no vazio que se marca.
 *
 * A fita de dias não sumiu: virou o cabeçalho da própria grade, com o número
 * do dia e o círculo no hoje (ver GradeDeHorario).
 *
 * `onSelecionarDia` ficou no lugar por compatibilidade com a tela que monta
 * esta visão, mas não há mais o que tocar para "abrir o dia": o dia já está
 * aberto. Tocar num evento vai para ele; tocar no vazio abre o formulário com
 * a data e a hora daquele ponto.
 */
export function SemanaView({
  dataReferencia,
}: {
  dataReferencia: string;
  onSelecionarDia?: (dataISO: string) => void;
}) {
  const inicio = inicioDaSemana(new Date(`${dataReferencia}T00:00:00`));
  const inicioISO = paraISOLocal(inicio);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 6);
  const fimISO = paraISOLocal(fim);

  const { agendamentos, loading } = useAgendamentos(inicioISO, fimISO);

  const dias = useMemo(() => {
    const primeiro = new Date(`${inicioISO}T00:00:00`);
    return Array.from({ length: 7 }, (_, i) => {
      const dia = new Date(primeiro);
      dia.setDate(dia.getDate() + i);
      return dia;
    });
  }, [inicioISO]);

  if (loading) {
    return <Skeleton className="h-[60vh] w-full rounded-[10px]" />;
  }

  return <GradeDeHorario dias={dias} agendamentos={agendamentos} />;
}
