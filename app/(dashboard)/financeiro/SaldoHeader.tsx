import { Valor } from "@/components/Valor";

/**
 * O saldo, na anatomia do "Saldo em contas" da referência: rótulo miúdo, número
 * grande, e as duas linhas que EXPLICAM de onde ele veio.
 *
 * Antes era um texto centralizado no alto da página, sem cartão e fora da
 * escala tipográfica do resto do app (`text-3xl` no meio de uma tela onde todo
 * valor grande é 32 ou 40px). Centralizado, ele também não conversava com nada:
 * em toda a referência o número mora à esquerda, alinhado com o rótulo dele.
 *
 * A COR SAIU. Saldo positivo em verde e negativo em vermelho pintava o maior
 * texto da tela com a cor de alarme num dia comum de contas a pagar. O sinal de
 * menos já diz o que precisa ser dito, e as duas linhas abaixo mostram a conta
 * inteira.
 */
export function SaldoHeader({
  saldo,
  entradas,
  saidas,
}: {
  saldo: number;
  entradas: number;
  saidas: number;
}) {
  return (
    <div className="vidro-card rounded-[20px] p-4">
      <p className="text-[15px] leading-tight text-neutro-muted">
        Saldo em caixa
      </p>
      <Valor
        valor={saldo}
        className="mt-1 block truncate text-[40px] font-bold leading-none tracking-tight text-escuro"
      />

      <div className="mt-4 flex flex-col gap-2">
        <Linha rotulo="Entradas" valor={entradas} />
        <Linha rotulo="Saídas" valor={saidas} />
      </div>
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
