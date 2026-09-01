"use client";

/**
 * O anel de progresso — o gráfico que a referência usa nos widgets pequenos.
 *
 * É grosso e grande de propósito: no widget de "Limite disponível" ele ocupa
 * quase um terço da largura do cartão, com traço largo. Essa proporção é o que
 * dá PESO ao widget. Um anel fino e pequeno vira enfeite; este é o assunto da
 * metade de cima do cartão, e o número embaixo é a legenda dele.
 *
 * A trilha aparece sempre, mesmo em 0%: ela é a forma que o olho reconhece
 * antes de ler qualquer coisa, e é ela que diz "aqui tem uma proporção".
 */
export function Anel({
  progresso,
  tamanho = 56,
  espessura = 9,
  cor = "rgb(var(--primary-forte))",
}: {
  /** De 0 a 100. */
  progresso: number;
  tamanho?: number;
  espessura?: number;
  cor?: string;
}) {
  const raio = (tamanho - espessura) / 2;
  const circunferencia = 2 * Math.PI * raio;
  const preenchido = Math.min(100, Math.max(0, progresso));

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox={`0 0 ${tamanho} ${tamanho}`}
      aria-hidden="true"
      className="block"
    >
      <circle
        cx={tamanho / 2}
        cy={tamanho / 2}
        r={raio}
        fill="none"
        stroke="rgb(var(--vidro-fundo) / 0.12)"
        strokeWidth={espessura}
      />
      {preenchido > 0 && (
        <circle
          cx={tamanho / 2}
          cy={tamanho / 2}
          r={raio}
          fill="none"
          stroke={cor}
          strokeWidth={espessura}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - preenchido / 100)}
          // Começa no topo: um progresso que nasce na direita não parece
          // progresso, parece um pedaço faltando.
          transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
          className="transition-[stroke-dashoffset] duration-500 ease-out motion-reduce:transition-none"
        />
      )}
    </svg>
  );
}
