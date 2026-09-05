"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { vibrar } from "@/lib/nativo";

/** Quanto tempo o "Copiado" fica antes de voltar ao normal. */
const TEMPO_CONFIRMANDO = 1600;

/**
 * Um valor que se copia com um toque.
 *
 * EXISTE PORQUE A SELEÇÃO DE TEXTO FOI DESLIGADA no celular — segurar o dedo
 * disputava o toque longo do painel de widgets, e em app iOS aquilo é gesto de
 * navegador de qualquer forma. Mas desligar sem oferecer nada no lugar tirou
 * uma capacidade real: copiar o telefone de uma cliente para colar no
 * WhatsApp. Este componente é a troca — em vez de segurar e mirar nas
 * alcinhas, um toque.
 *
 * A CONFIRMAÇÃO NÃO É SÓ MOVIMENTO. O ícone troca de "copiar" para "check", e
 * o rótulo de acessibilidade muda junto: quem não enxerga a animação — por
 * preferência de sistema, por pressa ou por leitor de tela — ainda sabe que
 * deu certo. Animação nunca pode ser o único canal de retorno.
 *
 * Os dois ícones ficam SEMPRE no DOM, um sobre o outro em posição absoluta, e
 * o que muda é opacidade, escala e desfoque. Trocar por renderização
 * condicional daria um pulo seco: sem elemento de saída, não há como animar a
 * saída. Não uso a `motion` aqui de propósito — ela está instalada, mas dentro
 * do app o `transform` dela em ancestral quebra o `backdrop-filter` do vidro.
 */
export function ValorCopiavel({
  valor,
  rotulo,
  className,
  children,
}: {
  /** O texto que vai para a área de transferência. */
  valor: string;
  /** O que este valor é, para quem usa leitor de tela: "telefone", "chave PIX". */
  rotulo: string;
  className?: string;
  /** O valor como ele deve APARECER — formatado, mascarado, o que a tela quiser. */
  children?: React.ReactNode;
}) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
    } catch {
      // Sem permissão de área de transferência não há o que fazer, e insistir
      // com um erro na tela seria pior: a pessoa não tem como resolver.
      return;
    }

    // O toque confirma no dedo antes de o olho ler o "Copiado".
    void vibrar();
    setCopiado(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => setCopiado(false),
      TEMPO_CONFIRMANDO,
    );
  }

  return (
    <button
      type="button"
      onClick={copiar}
      // O rótulo carrega o estado, e é ele que um leitor de tela anuncia.
      aria-label={copiado ? `${rotulo} copiado` : `Copiar ${rotulo}`}
      className={cn(
        /*
         * `min-h-11` são os 44pt que o iOS pede de alvo de toque. O valor
         * costuma ser uma linha de texto de 20px de altura: sem isto, o alvo
         * teria metade do tamanho mínimo, e errar o toque num botão que copia
         * é especialmente irritante porque não há o que desfazer.
         */
        "group inline-flex min-h-11 items-center gap-2 rounded-button px-1 text-left",
        // Só o que muda, nomeado: `transition-all` aqui pegaria cor, sombra e
        // tamanho de fonte de carona.
        "transition-[scale] duration-150 ease-out active:scale-[0.96]",
        "motion-reduce:active:scale-100",
        className,
      )}
    >
      <span className="min-w-0 truncate">{children ?? valor}</span>

      {/*
        A caixa do ícone tem tamanho fixo para o texto ao lado não se mexer na
        troca. Os dois ícones ocupam o mesmo ponto; um está sempre saindo
        enquanto o outro entra.
      */}
      <span
        aria-hidden="true"
        className="relative h-4 w-4 flex-shrink-0 text-neutro-icon"
      >
        <Copy
          // 1.5px ao lado de texto normal: um traço de 2px pesaria mais que a
          // própria palavra que ele acompanha.
          strokeWidth={1.5}
          className={cn(
            "absolute inset-0 h-4 w-4",
            "transition-[opacity,scale,filter] duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
            copiado
              ? "scale-[0.25] opacity-0 blur-[4px]"
              : "scale-100 opacity-100 blur-0",
          )}
        />
        <Check
          strokeWidth={1.5}
          className={cn(
            "absolute inset-0 h-4 w-4 text-primary-forte",
            "transition-[opacity,scale,filter] duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
            copiado
              ? "scale-100 opacity-100 blur-0"
              : "scale-[0.25] opacity-0 blur-[4px]",
          )}
        />
      </span>
    </button>
  );
}
