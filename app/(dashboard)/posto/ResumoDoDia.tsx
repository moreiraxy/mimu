"use client";

import { useEffect, useState } from "react";
import { Check, Copy, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { montarResumoDoDia } from "@/lib/posto/resumo";
import type { Database } from "@/types/database";
import type { EstadoDaRotina } from "@/lib/posto/rotina";
import { BLOCO, ROTULO } from "./estilos";
import { cn } from "@/lib/utils";

type Pendencia = Database["public"]["Tables"]["posto_pendencias"]["Row"];

/**
 * O resumo das 17:45, montado e editável.
 *
 * A tela monta o rascunho; quem manda é ela. Mandar sozinha seria escrever em
 * nome dela para o gerente — e o documento, no item 3.9, trata esse tipo de
 * mensagem como coisa que precisa de gente decidindo.
 *
 * O texto fica EDITÁVEL de propósito. Resumo gerado que não pode ser corrigido
 * é resumo que ela reescreve no WhatsApp do zero, e aí a tela não economizou
 * nada.
 */
export function ResumoDoDia({
  rotina,
  numeros,
  pendencias,
  dataTexto,
  salvo,
  onSalvar,
}: {
  rotina: EstadoDaRotina;
  numeros: Record<string, number>;
  pendencias: Pendencia[];
  dataTexto: string;
  salvo: { texto: string; enviadoEm: string | null } | null;
  onSalvar: (texto: string, enviado: boolean) => Promise<boolean>;
}) {
  const [texto, setTexto] = useState(salvo?.texto ?? "");
  const [copiado, setCopiado] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Quando o banco responde depois da primeira pintura, o rascunho salvo
  // precisa aparecer — mas só se ela ainda não começou a digitar, senão a tela
  // apagaria o que ela escreveu.
  useEffect(() => {
    if (salvo?.texto && texto === "") setTexto(salvo.texto);
  }, [salvo, texto]);

  function montar() {
    setTexto(
      montarResumoDoDia({
        blocosFeitos: rotina.feitos.map((b) => b.chave),
        numeros,
        pendenciasAbertas: pendencias,
        dataTexto,
      }),
    );
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Área de transferência bloqueada acontece de verdade (contexto não
      // seguro, permissão negada no iOS). O texto está na tela e dá para
      // selecionar à mão — avisar com alerta aqui seria pior que o silêncio.
    }
  }

  async function marcarEnviado() {
    setSalvando(true);
    await onSalvar(texto, true);
    setSalvando(false);
  }

  return (
    <section className={BLOCO}>
      <header className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className={cn("", ROTULO)}>
          Resumo para o Dyego
        </h2>
        {salvo?.enviadoEm && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-verde-light px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-verde-texto">
            <Check className="size-3" /> enviado
          </span>
        )}
      </header>

      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={texto ? 12 : 4}
        placeholder="Toque em “Montar com o meu dia” e corrija o que quiser."
        className="w-full resize-y rounded-button border border-neutro-border bg-escuro/[0.04] px-3.5 py-3 font-mono text-[13px] leading-relaxed text-escuro outline-none transition-colors placeholder:text-neutro-muted focus:border-primary-forte focus:bg-escuro/[0.08]"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={montar}>
          <RefreshCw className="mr-1.5 inline size-4" />
          Montar com o meu dia
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={copiar}
          disabled={!texto}
        >
          {copiado ? (
            <Check className="mr-1.5 inline size-4" />
          ) : (
            <Copy className="mr-1.5 inline size-4" />
          )}
          {copiado ? "Copiado" : "Copiar"}
        </Button>
        <Button size="sm" onClick={marcarEnviado} disabled={!texto || salvando}>
          <Send className="mr-1.5 inline size-4" />
          Já mandei
        </Button>
      </div>
    </section>
  );
}
