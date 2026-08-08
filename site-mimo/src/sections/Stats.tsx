import { useEffect, useState } from "react";
import { Counter } from "../components/Counter";

/*
 * This grid has no reveal of its own. In the original it is the fourth child of
 * the hero's `Visual Wrapper` (framer-rosd92) — alongside the two hero photos
 * and the logo strip — and the whole wrapper carries one appear animation, from
 * index.html's appearAnimationsContent table:
 *   rosd92: initial { opacity: 0.001 }  ->  animate { opacity: 1 },
 *           transition { bounce: .1, delay: .7, duration: 1.2, type: "spring" }
 * It fires on load, not on scroll, and touches opacity only — no offset.
 *
 * Motion solves that bounce/duration pair to stiffness 49.95 / damping 12.72
 * (mass 1, ratio 0.9). Sampled at 24 steps so the 0.15% overshoot is the
 * original's own and not an eyeballed cubic-bezier.
 */
const APPEAR_MS = 1200;
const APPEAR_DELAY = 700;
const APPEAR_SPRING =
  "linear(0, 0.0506, 0.1641, 0.3007, 0.4369, 0.5605, 0.6662, 0.7526, 0.821, 0.8735, 0.9129, 0.9418, 0.9623, 0.9767, 0.9864, 0.9928, 0.9968, 0.9993, 1.0006, 1.0013, 1.0015, 1.0015, 1.0013, 1.0011, 1.0009)";

/**
 * Os quatro números com que o site atual da Mimu abre a conversa. Os três
 * primeiros são os do bloco abaixo do CTA (teste, mensalidade, configuração) e
 * o quarto é a base que o selo do topo anuncia — mantidos idênticos nos dois
 * lugares para o site não se contradizer.
 *
 * `prefix`/`suffix` existem porque o <Counter> só anima o miolo numérico: com
 * "R$ " dentro do valor ele tentaria interpolar a string inteira.
 */
const STATS = [
  { value: "7", suffix: " dias", label: "grátis para começar" },
  { prefix: "R$ ", value: "39", label: "por mês depois" },
  { value: "2", suffix: " min", label: "para configurar tudo" },
  { prefix: "+", value: "400", label: "negócios de bairro" },
];

/** Four stat cards closing out the hero. */
export function Stats() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <ul
      className="grid w-full grid-cols-2 gap-2 lg:grid-cols-4"
      style={{
        opacity: on ? 1 : 0.001,
        transition: `opacity ${APPEAR_MS}ms ${APPEAR_SPRING} ${APPEAR_DELAY}ms`,
      }}
    >
      {STATS.map((stat) => (
        <li
          key={stat.label}
          className="flex flex-col items-center justify-center gap-3 overflow-clip rounded-lg bg-sand p-6 text-center lg:h-[165px]"
        >
          <div className="flex flex-col items-center gap-2">
            <Counter
              prefix={stat.prefix}
              value={stat.value}
              suffix={stat.suffix}
              className="font-display text-[39px] leading-[39px] font-extrabold tracking-[-1.56px] text-ink"
            />
            <p className="font-display text-xs leading-[15.6px] font-medium text-muted-strong">
              {stat.label}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
