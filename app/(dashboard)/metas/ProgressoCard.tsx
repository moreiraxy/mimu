"use client";

import { AlertTriangle, TrendingUp } from "lucide-react";
import { Valor } from "@/components/Valor";

/**
 * O progresso do mês, na anatomia do "Faturamento de hoje": rótulo miúdo,
 * número grande, barra fina em néon e as linhas que explicam o número.
 *
 * O QUE SAIU DAQUI FOI UMA CAIXA COLORIDA. A projeção do fechamento morava num
 * bloco verde-claro ou âmbar, com o texto em verde-escuro ou âmbar-escuro — e
 * era a única área de cor preenchida da tela. Num mês devagar ela pintava de
 * alerta a informação mais importante da página, como se estar atrás da meta no
 * dia 10 fosse um defeito do sistema.
 *
 * A barra também tinha quatro cores conforme o estado, uma delas vermelha. Ela
 * agora é sempre a da marca, como em toda barra do app: quem diferencia um mês
 * do outro é o QUANTO ela avança, que é a informação de verdade — a cor não
 * acrescenta nada e ainda muda o clima da tela sem avisar.
 */
export function ProgressoCard({
  realizado,
  meta,
  progresso,
  projecaoFechamento,
}: {
  realizado: number;
  meta: number;
  progresso: number;
  projecaoFechamento: number;
}) {
  const larguraBarra = Math.min(100, Math.max(0, progresso));
  const vaiBaterMeta = meta > 0 && projecaoFechamento >= meta;
  const Icone = vaiBaterMeta ? TrendingUp : AlertTriangle;

  return (
    <div className="vidro-card rounded-[20px] p-4">
      <p className="text-[15px] leading-tight text-neutro-muted">
        Realizado este mês
      </p>
      <Valor
        valor={realizado}
        className="mt-1 block truncate text-[40px] font-bold leading-none tracking-tight text-escuro"
      />

      {meta > 0 ? (
        <>
          <div className="mt-4 h-[5px] w-full overflow-hidden rounded-full bg-escuro/[0.10]">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
              style={{ width: `${larguraBarra}%` }}
            />
          </div>

          <div className="mt-3.5 flex flex-col gap-2">
            <Linha rotulo={`${progresso}% da meta`} valor={meta} />
            <Linha rotulo="No ritmo atual, fecha em" valor={projecaoFechamento} />
          </div>

          {/* A leitura do ritmo é uma FRASE com um ícone, e não um bloco
              colorido — o mesmo formato da linha de estado do cartão de hoje. */}
          <p className="mt-3 flex items-start gap-1.5 text-[13px] text-neutro-muted">
            <Icone
              className="mt-[3px] h-3.5 w-3.5 flex-shrink-0 text-primary-forte"
              strokeWidth={2.5}
            />
            {vaiBaterMeta
              ? "Nesse ritmo a meta é batida."
              : "Nesse ritmo a meta fica em risco. Vale acelerar."}
          </p>
        </>
      ) : (
        <p className="mt-3 text-[15px] text-neutro-muted">
          Defina uma meta mensal para acompanhar o progresso.
        </p>
      )}
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="truncate text-[15px] text-neutro-muted">{rotulo}</span>
      <Valor valor={valor} className="text-[15px] font-bold text-escuro" />
    </div>
  );
}
