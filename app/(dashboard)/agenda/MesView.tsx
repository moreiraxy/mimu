"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, paraISOLocal } from "@/lib/utils";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { Skeleton } from "@/components/ui/Skeleton";

const DIAS_SEMANA = ["S", "T", "Q", "Q", "S", "S", "D"];
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/**
 * O mês inteiro numa tela.
 *
 * A agenda tinha só dia e semana, e as duas respondem a mesma pergunta —
 * "o que tem agora". A do mês responde outra, que é a que faz alguém abrir a
 * agenda sem ter um compromisso em mente: onde estão os buracos, que semana
 * está cheia, dá para encaixar alguém na quinta.
 *
 * Cada dia mostra a CONTAGEM, e não uma lista. Num quadrado de 44px não cabe
 * "Corte + escova às 14h", e tentar espremer isso produz três letras cortadas
 * que não dizem nada. O número diz o que importa nesta altura — quanto tem
 * naquele dia — e o toque leva ao dia, onde cabe o resto.
 */
export function MesView({
  dataReferencia,
  onMudarMes,
  onSelecionarDia,
}: {
  dataReferencia: string;
  onMudarMes: (dataISO: string) => void;
  onSelecionarDia: (dataISO: string) => void;
}) {
  const referencia = new Date(`${dataReferencia}T00:00:00`);
  const ano = referencia.getFullYear();
  const mes = referencia.getMonth();

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const inicioISO = paraISOLocal(primeiroDia);
  const fimISO = paraISOLocal(ultimoDia);

  const { agendamentos, loading } = useAgendamentos(inicioISO, fimISO);
  const hojeISO = paraISOLocal(new Date());

  /*
   * Quantos atendimentos em cada dia.
   *
   * Um mapa, e não um filtro por célula: com 31 células, filtrar a lista
   * inteira em cada uma percorre a lista 31 vezes para montar uma tela só.
   */
  const porDia = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const a of agendamentos) {
      const iso = paraISOLocal(new Date(a.data_hora));
      contagem.set(iso, (contagem.get(iso) ?? 0) + 1);
    }
    return contagem;
  }, [agendamentos]);

  /*
   * As células, incluindo as vazias do começo.
   *
   * A grade começa na segunda-feira, então um mês que cai numa quinta precisa
   * de três buracos antes do dia 1 — sem eles, todo dia cairia na coluna
   * errada e o calendário mentiria sobre o dia da semana.
   */
  const celulas = useMemo(() => {
    const vaziasNoComeco = (primeiroDia.getDay() + 6) % 7;
    const total = ultimoDia.getDate();
    return [
      ...Array.from({ length: vaziasNoComeco }, () => null),
      ...Array.from({ length: total }, (_, i) => {
        const dia = new Date(ano, mes, i + 1);
        return { numero: i + 1, iso: paraISOLocal(dia) };
      }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ano, mes]);

  function irParaMes(passo: number) {
    onMudarMes(paraISOLocal(new Date(ano, mes + passo, 1)));
  }

  return (
    <div className="vidro-card rounded-[20px] p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => irParaMes(-1)}
          aria-label="Mês anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutro-muted"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={2} />
        </button>
        {/* `capitalize` do CSS maiúscula TODA palavra e produzia "Setembro De
            2026". A primeira letra basta, e só ela. */}
        <p className="text-[15px] font-semibold text-escuro first-letter:uppercase">
          {MESES[mes]} de {ano}
        </p>
        <button
          type="button"
          onClick={() => irParaMes(1)}
          aria-label="Próximo mês"
          className="flex h-9 w-9 items-center justify-center rounded-full text-neutro-muted"
        >
          <ChevronRight className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {DIAS_SEMANA.map((dia, i) => (
          <span
            key={i}
            className="pb-1 text-center text-[11px] font-semibold text-neutro-muted"
          >
            {dia}
          </span>
        ))}

        {loading
          ? Array.from({ length: 35 }, (_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))
          : celulas.map((celula, i) =>
              celula === null ? (
                <span key={`vazio-${i}`} />
              ) : (
                <button
                  key={celula.iso}
                  type="button"
                  onClick={() => onSelecionarDia(celula.iso)}
                  aria-label={`Dia ${celula.numero}${
                    porDia.get(celula.iso)
                      ? `, ${porDia.get(celula.iso)} atendimentos`
                      : ", sem atendimentos"
                  }`}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-[13px] transition-colors",
                    celula.iso === hojeISO
                      ? "bg-primary/20 font-bold text-primary-forte"
                      : "text-escuro active:bg-neutro-disabled",
                  )}
                >
                  {celula.numero}
                  {/* O ponto é a presença; o número dentro dele é a
                      quantidade. Dia vazio não ganha marca nenhuma — é o vazio
                      que precisa ser fácil de achar nesta tela. */}
                  {porDia.get(celula.iso) ? (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-verde px-1 text-[9px] font-bold leading-none text-white">
                      {porDia.get(celula.iso)}
                    </span>
                  ) : (
                    <span className="h-4" />
                  )}
                </button>
              ),
            )}
      </div>
    </div>
  );
}
