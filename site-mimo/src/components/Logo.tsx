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

/**
 * Como o traço aparece: pronto de uma vez, ou sendo desenhado.
 *
 * `pathLength={1}` normaliza o comprimento do caminho para 1, seja qual for o
 * tamanho na tela. Sem isso seria preciso medir o path com `getTotalLength()`
 * em JavaScript e guardar o número num estado — um valor a mais para
 * dessincronizar, e que quebraria calado se o desenho do "M" mudasse.
 */
export interface Tracado {
  /** `false` esconde o traço inteiro; `true` desenha até o fim. */
  visivel: boolean;
  duracaoMs: number;
  easing: string;
  /**
   * Avisa quando o traço chegou ao fim de verdade.
   *
   * Quem usa isso precisa saber que a letra ficou inteira, e não que o relógio
   * marcou o tempo previsto. Numa página carregando, a thread principal
   * atrasa o começo da transição sem atrasar os outros temporizadores, e aí o
   * que vem depois começa com o "M" ainda pela metade.
   */
  aoTerminar?: () => void;
}

/** O "M". `stroke` acompanha `currentColor` para o símbolo servir a qualquer fundo. */
export function MimuMark({
  className = "",
  strokeWidth = 5,
  tracado,
}: {
  className?: string;
  strokeWidth?: number;
  /** Quando presente, o "M" é desenhado em vez de aparecer pronto. */
  tracado?: Tracado;
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
        pathLength={tracado ? 1 : undefined}
        strokeDasharray={tracado ? 1 : undefined}
        strokeDashoffset={tracado ? (tracado.visivel ? 0 : 1) : undefined}
        onTransitionEnd={
          tracado?.aoTerminar
            ? (evento) => {
                // O elemento tem outras transições possíveis; só a do traço
                // significa "a letra ficou pronta".
                if (evento.propertyName === "stroke-dashoffset") {
                  tracado.aoTerminar?.();
                }
              }
            : undefined
        }
        style={
          tracado
            ? {
                transition: `stroke-dashoffset ${tracado.duracaoMs}ms ${tracado.easing}`,
              }
            : undefined
        }
      />
    </svg>
  );
}

/**
 * O ícone fechado: "M" branco dentro do quadrado coral. É o bloco que aparece
 * no header, no rodapé e como ícone do app.
 */
export function MimuIcon({
  className = "",
  tracado,
}: {
  className?: string;
  /** Repassado ao "M": só a abertura do site usa, para desenhá-lo na hora. */
  tracado?: Tracado;
}) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center bg-coral text-primary-text ${className}`}
    >
      {/* 58% da caixa: a proporção que o manual repete em todas as aplicações
          (42/72 na capa, 48/80 no logo, 92/168 no ícone do app). */}
      <MimuMark className="h-[43%] w-[58%]" tracado={tracado} />
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
        {/* Wordmark em Indie Flower (brand book novo), a única aplicação de
            `font-brand` no site; títulos continuam em `font-display`
            (Geist), senão virariam cursiva junto. */}
        <span
          className={`font-brand text-[26px] leading-none ${
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
