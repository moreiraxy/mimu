export function ProgressoCircular({
  percentual,
  tamanho = 180,
  espessura = 14,
}: {
  percentual: number;
  tamanho?: number;
  espessura?: number;
}) {
  const clampado = Math.min(100, Math.max(0, percentual));
  const raio = tamanho / 2 - espessura / 2 - 2;
  const centro = tamanho / 2;
  const circunferencia = 2 * Math.PI * raio;
  const offset = circunferencia * (1 - clampado / 100);

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox={`0 0 ${tamanho} ${tamanho}`}
      className="-rotate-90"
    >
      <circle
        cx={centro}
        cy={centro}
        r={raio}
        fill="none"
        stroke="#FFF5F4"
        strokeWidth={espessura}
      />
      <circle
        cx={centro}
        cy={centro}
        r={raio}
        fill="none"
        stroke="#FF6B5B"
        strokeWidth={espessura}
        strokeDasharray={circunferencia}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  );
}
