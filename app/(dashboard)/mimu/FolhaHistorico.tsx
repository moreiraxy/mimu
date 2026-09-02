"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Smartphone, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMountedTransition } from "@/hooks/useMountedTransition";
import { cn } from "@/lib/utils";

const DURACAO_SAIDA = 240;

/**
 * Quantas mensagens a lista olha para trás.
 *
 * 300 cobre semanas de uso normal numa consulta só. Paginar aqui seria
 * resolver um problema que esta tela não tem: quem abre o histórico está
 * procurando "aquela conversa de terça", e não lendo o arquivo inteiro.
 */
const LIMITE = 300;

type Canal = "app" | "whatsapp";

interface Linha {
  id: string;
  role: "user" | "assistant";
  content: string;
  canal: Canal;
  created_at: string;
}

interface Dia {
  chave: string;
  rotulo: string;
  linhas: Linha[];
  canais: Canal[];
  /** A primeira coisa que a pessoa perguntou naquele dia — é como ela lembra. */
  previa: string;
}

const CANAL = {
  app: { icone: Smartphone, label: "No app" },
  whatsapp: { icone: MessageCircle, label: "WhatsApp" },
} as const;

function rotuloDoDia(iso: string): string {
  const data = new Date(iso);
  const hoje = new Date();
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);

  const mesmoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (mesmoDia(data, hoje)) return "Hoje";
  if (mesmoDia(data, ontem)) return "Ontem";
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(data);
}

function hora(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function agruparPorDia(linhas: Linha[]): Dia[] {
  const mapa = new Map<string, Linha[]>();

  for (const linha of linhas) {
    const data = new Date(linha.created_at);
    const chave = `${data.getFullYear()}-${data.getMonth()}-${data.getDate()}`;
    const lista = mapa.get(chave);
    if (lista) lista.push(linha);
    else mapa.set(chave, [linha]);
  }

  return Array.from(mapa.entries()).map(([chave, doDia]) => ({
    chave,
    rotulo: rotuloDoDia(doDia[0]!.created_at),
    linhas: doDia,
    canais: Array.from(new Set(doDia.map((l) => l.canal))),
    previa:
      doDia.find((l) => l.role === "user")?.content ??
      doDia[0]?.content ??
      "",
  }));
}

/**
 * As conversas recentes — as do app e as do WhatsApp, na mesma lista.
 *
 * A MIMU É UMA SÓ, e a memória dela também: o que foi dito pelo WhatsApp de
 * manhã ela sabe no app à tarde, porque tudo mora na mesma conversa. O que
 * faltava era a pessoa CONSEGUIR RECONHECER a própria conversa aqui dentro —
 * ela não lembra de ter falado "com a Mimu", ela lembra de ter falado no
 * WhatsApp. Por isso cada dia diz por onde passou.
 *
 * Substitui o botão de lixeira que morava neste canto. Apagar tudo era a única
 * coisa que dava para fazer com o histórico, e era a mais destrutiva possível
 * — agora ela é o último item aqui dentro, onde se chega depois de ver o que
 * seria apagado.
 */
export function FolhaHistorico({
  aberta,
  aoFechar,
  empresaId,
  aoPedirLimpeza,
}: {
  aberta: boolean;
  aoFechar: () => void;
  empresaId: string;
  aoPedirLimpeza: () => void;
}) {
  const { rendered, visible } = useMountedTransition(aberta, DURACAO_SAIDA);
  const painelRef = useRef<HTMLDivElement>(null);
  const [supabase] = useState(() => createClient());
  const [dias, setDias] = useState<Dia[] | null>(null);
  const [abertoNoDia, setAbertoNoDia] = useState<string | null>(null);

  useEffect(() => {
    if (!aberta) return;
    let cancelado = false;

    (async () => {
      const { data } = await supabase
        .from("conversas_mimu")
        .select("id, role, content, canal, created_at")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false })
        .limit(LIMITE);

      if (cancelado) return;
      // Volta à ordem do relógio dentro de cada dia; os dias seguem do mais
      // recente para o mais antigo, que é a ordem em que se procura.
      setDias(agruparPorDia((data ?? []).slice().reverse() as Linha[]).reverse());
    })();

    return () => {
      cancelado = true;
    };
  }, [aberta, empresaId, supabase]);

  useEffect(() => {
    if (!aberta) return;

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    document.addEventListener("keydown", aoTeclar);

    const overflowAntes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    painelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAntes;
    };
  }, [aberta, aoFechar]);

  if (!rendered) return null;

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label="Conversas recentes"
    >
      <div
        aria-hidden="true"
        onClick={aoFechar}
        className={cn(
          "absolute inset-0 bg-black/65 transition-opacity duration-200 motion-reduce:transition-none",
          visible ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        ref={painelRef}
        tabIndex={-1}
        className={cn(
          "absolute inset-x-0 bottom-0 outline-none",
          "transition-transform duration-[240ms] ease-out motion-reduce:transition-none",
          visible ? "translate-y-0" : "translate-y-full",
        )}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
      >
        <div className="mx-auto max-w-[430px] px-3">
          <div className="vidro overflow-hidden rounded-[28px] shadow-[0_-8px_40px_-12px_rgba(0,0,0,0.5)]">
            <div className="flex justify-center py-2">
              <span
                aria-hidden="true"
                className="h-1 w-9 rounded-full bg-neutro-muted/50"
              />
            </div>

            <p className="px-4 pb-2 text-[15px] font-bold text-escuro">
              Conversas recentes
            </p>

            {/* Altura máxima em vh: a folha cresce com o conteúdo até caber
                pouco mais de meia tela e só então rola por dentro. Sem o teto,
                um mês de conversa empurraria o "Limpar" para fora da tela. */}
            <div className="max-h-[60vh] overflow-y-auto px-2 pb-2">
              {dias === null ? (
                <p className="px-2 py-6 text-center text-[13px] text-neutro-muted">
                  Carregando...
                </p>
              ) : dias.length === 0 ? (
                <p className="px-2 py-6 text-center text-[15px] text-neutro-muted">
                  Nenhuma conversa ainda.
                </p>
              ) : (
                dias.map((dia) => {
                  const expandido = abertoNoDia === dia.chave;
                  return (
                    <div key={dia.chave}>
                      <button
                        type="button"
                        onClick={() =>
                          setAbertoNoDia(expandido ? null : dia.chave)
                        }
                        className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors active:bg-escuro/[0.06]"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[15px] font-bold capitalize text-escuro">
                              {dia.rotulo}
                            </span>
                            {dia.canais.map((canal) => {
                              const Icone = CANAL[canal].icone;
                              return (
                                <span
                                  key={canal}
                                  title={CANAL[canal].label}
                                  className="flex h-5 items-center gap-1 rounded-full bg-primary/20 px-1.5 text-[10px] font-semibold text-primary-forte"
                                >
                                  <Icone className="h-3 w-3" strokeWidth={2.5} />
                                  {CANAL[canal].label}
                                </span>
                              );
                            })}
                          </div>
                          <p className="mt-0.5 truncate text-[13px] text-neutro-muted">
                            {dia.previa}
                          </p>
                        </div>
                        <span className="flex-shrink-0 pt-0.5 text-[13px] text-neutro-muted">
                          {dia.linhas.length}
                        </span>
                      </button>

                      {expandido && (
                        <div className="flex flex-col gap-2 px-3 pb-3">
                          {dia.linhas.map((linha) => (
                            <div
                              key={linha.id}
                              className={cn(
                                "max-w-[85%] rounded-2xl px-3 py-2 text-[13px]",
                                linha.role === "user"
                                  ? "self-end bg-primary/20 text-escuro"
                                  : "self-start bg-escuro/[0.06] text-escuro",
                              )}
                            >
                              <p className="whitespace-pre-wrap break-words">
                                {linha.content}
                              </p>
                              <p className="mt-1 text-[10px] text-neutro-muted">
                                {hora(linha.created_at)} ·{" "}
                                {CANAL[linha.canal].label}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                aoFechar();
                aoPedirLimpeza();
              }}
              className="flex w-full items-center gap-3 border-t border-escuro/[0.08] px-5 py-3.5 text-left transition-colors active:bg-escuro/[0.06]"
            >
              <Trash2
                className="h-[18px] w-[18px] flex-shrink-0 text-neutro-muted"
                strokeWidth={2}
              />
              <span className="text-[15px] font-semibold text-neutro-muted">
                Limpar histórico
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
