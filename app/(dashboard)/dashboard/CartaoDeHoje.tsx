"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Valor } from "@/components/Valor";
import { cn } from "@/lib/utils";
import type { StatusNegocio } from "@/lib/calculations";

/**
 * O cartão principal da home — o equivalente ao "Saldo em contas" da
 * referência.
 *
 * SUBSTITUI UM BLOCO DE NÉON CHAPADO que ocupava um terço da tela. A troca não
 * é de gosto: em nenhuma das nove telas da referência existe uma área grande de
 * cor saturada. A linguagem dela é sempre a mesma — cartão escuro, rótulo
 * miúdo, número grande, e a cor aparecendo só em traço fino (a linha do
 * gráfico, a barra de progresso, um selo pequeno).
 *
 * Um slab néon quebra isso de três formas ao mesmo tempo: rouba a atenção do
 * número (que é o assunto), obriga todo o texto de dentro a ficar preto para
 * ser legível, e faz o resto da tela parecer apagado por comparação. Era o
 * elemento mais alto da nossa home e o mais distante da referência.
 *
 * O estado do dia não se perdeu: virou o selo pequeno lá em cima, que é onde a
 * referência põe esse tipo de informação. A cor continua dizendo o que dizia,
 * na dose em que ela informa em vez de gritar.
 */
const ESTADO: Record<
  StatusNegocio,
  { icone: typeof TrendingUp; label: string }
> = {
  /*
   * O selo NÃO TEM COR PRÓPRIA — nenhum deles.
   *
   * Cada estado tinha a sua: verde no bom, âmbar na atenção, VERMELHO no dia
   * difícil. E vermelho num cartão de vidro néon é um corpo estranho: ele não
   * pertence à paleta da tela, puxa o olho antes do número (que é o assunto) e
   * transforma um dia fraco em alarme. Dia fraco não é erro do sistema nem
   * emergência — é terça-feira.
   *
   * Agora o selo usa a cor do PRÓPRIO widget, a da marca, em todos os estados.
   * Quem diferencia um dia do outro é o ícone e a palavra, que é onde a
   * informação está de verdade.
   */
  otimo: { icone: TrendingUp, label: "Ótimo dia" },
  atencao: { icone: AlertTriangle, label: "Atenção" },
  prejuizo: { icone: TrendingDown, label: "Dia difícil" },
  recorde: { icone: Trophy, label: "Recorde!" },
};

const FRASES: Record<StatusNegocio, Record<"manha" | "tarde" | "noite", string>> = {
  otimo: {
    manha: "Já começou bem o dia.",
    tarde: "Tarde produtiva.",
    noite: "Ótimo fechamento de dia.",
  },
  atencao: {
    manha: "O dia começou devagar.",
    tarde: "Ainda dá tempo de virar.",
    noite: "O dia foi mais devagar hoje.",
  },
  prejuizo: {
    manha: "Dia difícil pela frente.",
    tarde: "Segue com calma.",
    noite: "Foi um dia difícil.",
  },
  recorde: {
    manha: "Já começou batendo recorde.",
    tarde: "Recorde batido!",
    noite: "Que dia! Novo recorde no bolso.",
  },
};

function periodoDoDia(hora: number): "manha" | "tarde" | "noite" {
  if (hora >= 5 && hora < 12) return "manha";
  if (hora >= 12 && hora < 18) return "tarde";
  return "noite";
}

export function CartaoDeHoje({
  status,
  realizado,
  previsto,
  meta,
  progresso,
  tamanho = "medio",
}: {
  status: StatusNegocio;
  realizado: number;
  previsto: number;
  meta: number;
  progresso: number;
  tamanho?: "medio" | "grande";
}) {
  const estado = ESTADO[status];
  const frase = FRASES[status][periodoDoDia(new Date().getHours())];
  const larguraBarra = Math.min(100, Math.max(0, progresso));
  const grande = tamanho === "grande";

  /*
   * A ANATOMIA É A DO "Saldo em contas" DA REFERÊNCIA, nesta ordem:
   * rótulo miúdo, valor gigante, barra fina, e as linhas de apoio embaixo.
   *
   * O que saiu foi o selo colorido no alto. Ele era invenção minha: em nenhum
   * widget da referência existe uma etiqueta chamando atenção acima do número.
   * O primeiro item de um widget é sempre o RÓTULO, apagado, e logo abaixo
   * vem o valor — porque o assunto é o valor, e tudo mais é legenda dele.
   *
   * O estado do dia não se perdeu: virou uma linha discreta abaixo do número,
   * e só no tamanho grande, que é onde sobra altura para ela.
   */
  return (
    <Link
      href="/faturamento"
      className="vidro-card flex h-full flex-col overflow-hidden rounded-[20px] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[15px] leading-tight text-neutro-muted">
          Faturamento de hoje
        </p>
        <ChevronRight
          className="h-[18px] w-[18px] flex-shrink-0 text-neutro-muted"
          strokeWidth={2}
        />
      </div>

      <Valor
        valor={realizado}
        className={cn(
          "mt-1 block truncate font-bold leading-none tracking-tight text-escuro",
          grande ? "text-[40px]" : "text-[32px]",
        )}
      />

      {grande && (
        <p className="mt-2 flex items-center gap-1.5 text-[13px] text-neutro-muted">
          <estado.icone
            className="h-3.5 w-3.5 flex-shrink-0 text-primary-forte"
            strokeWidth={2.5}
          />
          {frase}
        </p>
      )}

      {/* A barra fina em néon é onde a cor da marca aparece neste widget —
          traço, e não área, que é a proporção da referência. */}
      <div className="mt-4 h-[5px] w-full overflow-hidden rounded-full bg-escuro/[0.10]">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${larguraBarra}%` }}
        />
      </div>

      {/* As linhas de apoio, no formato da lista de contas da referência:
          rótulo à esquerda, valor à direita, uma por linha. */}
      <div className="mt-3.5 flex flex-col gap-2">
        <LinhaDeApoio rotulo="Meta do dia" valor={meta} />
        {grande && <LinhaDeApoio rotulo="Previsto" valor={previsto} />}
      </div>
    </Link>
  );
}

function LinhaDeApoio({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="truncate text-[15px] text-neutro-muted">{rotulo}</span>
      <Valor valor={valor} className="text-[15px] font-bold text-escuro" />
    </div>
  );
}
