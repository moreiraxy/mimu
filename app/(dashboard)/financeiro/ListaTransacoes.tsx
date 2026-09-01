import Link from "next/link";
import { formatDate } from "@/lib/formatters";
import { Valor } from "@/components/Valor";
import { TransacaoItem } from "./TransacaoItem";
import type { TransacaoComCliente } from "@/types";

/**
 * O histórico, agrupado por dia.
 *
 * ANTES CADA LANÇAMENTO ERA UM CARTÃO SOLTO, com borda própria e um vão entre
 * eles. Vinte lançamentos viravam vinte caixinhas empilhadas, cada uma com sua
 * moldura — o oposto da referência, onde uma lista é UMA superfície com as
 * linhas separadas por um fio. Além de ruidoso, aquilo multiplicava por vinte o
 * custo do desfoque quando as linhas viraram vidro.
 *
 * Agora o dia inteiro é um cartão só, e a data com o total do dia fica FORA
 * dele, como título da seção — que é onde a referência põe esse tipo de rótulo.
 */
export function ListaTransacoes({
  grupos,
  onExcluir,
}: {
  grupos: [string, TransacaoComCliente[]][];
  onExcluir: (id: string) => void;
}) {
  if (grupos.length === 0) {
    return (
      <div className="vidro-card rounded-[20px] p-6 text-center">
        <p className="text-[15px] text-neutro-muted">
          Nenhuma transação por aqui ainda.
        </p>
        <Link
          href="/financeiro/nova-entrada"
          className="mt-3 inline-block text-[15px] font-bold text-primary-forte"
        >
          Registrar a primeira →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {grupos.map(([data, itens]) => (
        <div key={data}>
          <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
            <p className="truncate text-[13px] font-semibold text-neutro-muted">
              {formatDate(data)}
            </p>
            <TotalDoDia itens={itens} />
          </div>

          <div className="vidro-card overflow-hidden rounded-[20px]">
            {itens.map((transacao, indice) => (
              <TransacaoItem
                key={transacao.id}
                transacao={transacao}
                primeiro={indice === 0}
                onExcluir={() => onExcluir(transacao.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TotalDoDia({ itens }: { itens: TransacaoComCliente[] }) {
  const total = itens.reduce(
    (soma, t) =>
      soma + (t.tipo === "entrada" ? Number(t.valor) : -Number(t.valor)),
    0,
  );

  // Passa pelo <Valor> como todo número em dinheiro do app: um total de dia
  // solto aqui continuaria visível com os valores escondidos, e ele é
  // exatamente a soma do que a pessoa quis esconder.
  return (
    <Valor
      valor={total}
      className="flex-shrink-0 text-[13px] font-bold text-escuro"
    />
  );
}
