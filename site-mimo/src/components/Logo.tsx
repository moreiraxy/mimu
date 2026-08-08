/**
 * A marca da Mimu.
 *
 * O traçado vem do brand book verbatim: um "M" de linha contínua num viewBox
 * 48x36, com pontas e junções arredondadas. Ele é desenhado, não importado como
 * imagem, por três motivos que o manual cobra: herda a cor do contexto (o mesmo
 * símbolo serve sobre coral, sobre branco e sobre o escuro), continua nítido
 * nos 24px de altura mínima exigidos, e não pode ser distorcido por um
 * `object-fit` errado em lugar nenhum.
 *
 * O manual proíbe alterar as cores do símbolo — por isso o traço é sempre
 * branco dentro do quadrado coral, e a única variação permitida é o fundo.
 */

/** O "M". `stroke` acompanha `currentColor` para o símbolo servir a qualquer fundo. */
export function MimuMark({
  className = "",
  strokeWidth = 5,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 48 36"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M2 34 L2 8 Q2 2 8 2 Q14 2 16 8 L24 24 L32 8 Q34 2 40 2 Q46 2 46 8 L46 34"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * O ícone fechado: "M" branco dentro do quadrado coral. É o bloco que aparece
 * no header, no rodapé e como ícone do app.
 */
export function MimuIcon({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-coral text-white ${className}`}
    >
      {/* 58% da caixa: a proporção que o manual repete em todas as aplicações
          (42/72 na capa, 48/80 no logo, 92/168 no ícone do app). */}
      <MimuMark className="h-[43%] w-[58%]" />
    </span>
  );
}

/**
 * Logo completo — ícone + assinatura. `tagline` liga o "seu negócio,
 * organizado" que o manual mostra na versão para fundo claro.
 */
export function Logo({
  tone = "light",
  tagline = false,
  className = "",
}: {
  /** `light` = sobre fundo claro (palavra coral); `dark` = sobre o escuro (branca). */
  tone?: "light" | "dark";
  tagline?: boolean;
  className?: string;
}) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <MimuIcon className="size-9 rounded-[10px]" />
      <span className="flex flex-col">
        {/* -0.5px de entreletra e peso 800: o manual especifica os dois. */}
        <span
          className={`font-display text-[22px] leading-none font-extrabold tracking-[-0.5px] ${
            tone === "dark" ? "text-white" : "text-coral"
          }`}
        >
          mimu
        </span>
        {tagline && (
          <span className="mt-1 text-[11px] leading-none tracking-[0.02em] text-muted">
            seu negócio, organizado
          </span>
        )}
      </span>
    </span>
  );
}
