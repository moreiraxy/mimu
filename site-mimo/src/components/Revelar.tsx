import type { ReactNode } from "react";
import { useInView } from "../hooks/useInView";

/**
 * Entrada padrão do site: sobe um pouco e aparece. Repete toda vez que o
 * elemento volta pra tela — quem cuida disso é o `useInView`.
 *
 * Existe pra não repetir o mesmo bloco de `style` em cada seção. A curva e a
 * duração são as mesmas que o resto do site já usava (500ms na curva do
 * template), então o movimento continua igual — muda só onde ele aparece.
 *
 * Cuidado ao usar: este nó escreve `transform`, então ele não pode ser o
 * mesmo elemento que leva `data-parallax` (o hook do parallax também escreve
 * transform inline e um sobrescreve o outro). Nesses casos, um por fora do
 * outro — como já é feito em Produto, Depoimentos, Segurança e Preços.
 */
const EASE = "cubic-bezier(0.6, 0, 0.4, 1)";
const DURACAO_MS = 500;

export function Revelar({
  atraso = 0,
  deslocamento = 16,
  className = "",
  children,
}: {
  /** ms a esperar depois que o elemento entra na tela. */
  atraso?: number;
  /** de quantos px abaixo ele sobe. */
  deslocamento?: number;
  className?: string;
  children: ReactNode;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : `translateY(${deslocamento}px)`,
        transition: `opacity ${DURACAO_MS}ms ${EASE} ${atraso}ms, transform ${DURACAO_MS}ms ${EASE} ${atraso}ms`,
      }}
    >
      {children}
    </div>
  );
}
