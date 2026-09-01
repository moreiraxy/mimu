"use client";

import { formatCurrency } from "@/lib/formatters";
import { useValores } from "@/hooks/useValores";
import { VALOR_ESCONDIDO } from "@/lib/valores";
import { cn } from "@/lib/utils";

/**
 * Um valor em dinheiro que sabe se esconder.
 *
 * Existe como componente, e não como uma função de formatar, porque esconder
 * precisa de DUAS coisas que uma string não carrega: o `data-valor`, que a
 * regra de CSS usa para apagar o número antes de o React assumir, e o
 * `data-pronto`, que diz a essa mesma regra que ela já pode sair de cena.
 *
 * Ver lib/valores.ts para o porquê de o esconder existir, e o script inline
 * de app/(dashboard)/layout.tsx para o que acontece antes da hidratação.
 */
export function Valor({
  valor,
  className,
}: {
  valor: number;
  className?: string;
}) {
  const { escondidos, pronto } = useValores();

  return (
    <span
      data-valor=""
      data-pronto={pronto ? "" : undefined}
      className={cn(className)}
    >
      {escondidos ? VALOR_ESCONDIDO : formatCurrency(valor)}
    </span>
  );
}
