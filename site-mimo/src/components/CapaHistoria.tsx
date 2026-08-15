/**
 * Capa das histórias de cliente.
 *
 * Substitui as imagens que vieram do template: aquarelas de montanha com o
 * lockup "Marca + Payflow" escrito por cima. Além de não terem relação com um
 * salão de bairro em São Paulo, elas mostravam a marca de outro produto e
 * sugeriam parcerias que não existem.
 *
 * A saída não é procurar outra foto: seria trocar uma imagem emprestada por
 * outra. É assumir que aqui não há foto — o que existe é o nome do negócio, e
 * ele vira a capa, desenhado com a tipografia e a cor da própria Mimu.
 */

/** Duas letras a partir do nome do negócio, ignorando as palavras de ligação. */
function iniciais(nome: string): string {
  const palavras = nome
    .split(/\s+/)
    .filter((p) => !["da", "de", "do", "das", "dos", "e"].includes(p.toLowerCase()));

  const primeira = palavras[0]?.[0] ?? "";
  const segunda = palavras[1]?.[0] ?? palavras[0]?.[1] ?? "";
  return (primeira + segunda).toUpperCase();
}

export function CapaHistoria({
  negocio,
  ramo,
  className = "",
}: {
  negocio: string;
  ramo?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-superficie ${className}`}
      // Grade de pontos: a mesma textura dos depoimentos da home, para a
      // página de histórias não parecer um pedaço de outro site.
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.07) 1px, transparent 0)",
        backgroundSize: "22px 22px",
      }}
    >
      {/* Brilho do néon atrás das iniciais, bem discreto: dá profundidade sem
          virar o assunto da capa. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 42%, rgba(204,255,0,0.14) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex size-[76px] items-center justify-center rounded-[22px] bg-coral">
        <span className="font-display text-[26px] font-extrabold tracking-[-0.02em] text-primary-text">
          {iniciais(negocio)}
        </span>
      </div>

      <p className="relative mt-4 px-6 text-center font-display text-[17px] font-bold tracking-[-0.02em] text-ink">
        {negocio}
      </p>
      {ramo && (
        <p className="relative mt-1 font-mono text-[11px] tracking-[0.12em] text-muted uppercase">
          {ramo}
        </p>
      )}
    </div>
  );
}
