"use client";

import { useRef, Fragment } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";

/**
 * Título com as palavras revelando uma a uma ao entrar no viewport (estilo
 * eventos.desenrol.ai) — tradução do padrão "split + IntersectionObserver +
 * stagger manual" pro jeito idiomático do Framer Motion: um `useInView`
 * dispara um `animate` explícito por palavra com delay escalonado (mesmo
 * mecanismo já usado em outros pontos da página, ex.: os itens da agenda em
 * `FeatureFaturamentoSection`).
 *
 * `linhas` aceita um array pra preservar quebras de linha intencionais (ex.:
 * o H1 da Hero, que tem duas linhas de verdade) — o stagger continua entre
 * as linhas, contando as palavras em sequência do início ao fim.
 */
export function TituloAnimado({
  linhas,
  as = "h2",
  className,
}: {
  linhas: string | string[];
  as?: "h1" | "h2";
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const emVista = useInView(ref, { once: true, margin: "-80px" });
  const reduzida = useReducedMotion();
  const listaLinhas = Array.isArray(linhas) ? linhas : [linhas];

  const conteudoReduzido = listaLinhas.map((linha, i) => (
    <Fragment key={i}>
      {linha}
      {i < listaLinhas.length - 1 && <br />}
    </Fragment>
  ));

  let indiceGlobal = 0;
  const conteudoAnimado = listaLinhas.map((linha, indiceLinha) => (
    <span key={indiceLinha} className="block">
      {linha.split(" ").map((palavra, i, arr) => {
        const delay = indiceGlobal * 0.08;
        indiceGlobal += 1;
        return (
          <Fragment key={i}>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={emVista ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay, ease: "easeOut" }}
              className="inline-block"
            >
              {palavra}
            </motion.span>
            {i < arr.length - 1 ? " " : ""}
          </Fragment>
        );
      })}
    </span>
  ));

  if (as === "h1") {
    return (
      <h1 ref={ref} className={className}>
        {reduzida ? conteudoReduzido : conteudoAnimado}
      </h1>
    );
  }

  return (
    <h2 ref={ref} className={className}>
      {reduzida ? conteudoReduzido : conteudoAnimado}
    </h2>
  );
}
