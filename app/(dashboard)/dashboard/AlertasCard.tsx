"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  Package,
  ShieldAlert,
  TrendingDown,
  Trophy,
  UserX,
  X,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/useToast";
import type { AlertaMimu, TipoAlerta } from "@/types";
import type { AlertaMetadata } from "@/lib/mimu-prompts";

/*
 * Cada tipo tem O SEU ÍCONE, e NENHUM tem a sua cor.
 *
 * Antes eram discos chapados: âmbar em quase todos, vermelho nos dois graves,
 * néon no recorde — tudo dentro de um cartão âmbar-claro, o único bloco de cor
 * preenchida do painel. Um lembrete de que faltou registrar uma venda entrava
 * na tela com o mesmo peso visual de um incêndio, e ainda ficava difícil de
 * ler: texto escuro sobre âmbar no tema escuro.
 *
 * A Mimu avisa; ela não alarma. O disco agora é o véu da marca em todos, e
 * quem diferencia um aviso do outro é o desenho do ícone mais o texto — que é
 * onde a informação sempre esteve.
 */
const ICONE_POR_TIPO: Record<TipoAlerta, LucideIcon> = {
  sem_venda: Bell,
  agendamento_pendente: CalendarClock,
  conta_vencida: AlertTriangle,
  meta_risco: TrendingDown,
  recorde: Trophy,
  cliente_sumiu: UserX,
  estoque_baixo: Package,
  tentativa_prompt_injection: ShieldAlert,
};

function extrairMetadata(metadata: AlertaMimu["metadata"]): AlertaMetadata {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }
  return metadata as AlertaMetadata;
}

export function AlertasCard({
  alertas,
  onDispensar,
}: {
  alertas: AlertaMimu[];
  onDispensar: (id: string) => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());

  if (alertas.length === 0) return null;

  async function marcarContaComoPaga(transacaoId: string, alertaId: string) {
    const { error } = await supabase
      .from("transacoes")
      .update({ status_pagamento: "pago" })
      .eq("id", transacaoId);

    if (error) {
      showToast("Não consegui marcar como paga.");
      return;
    }
    showToast("Conta marcada como paga!");
    onDispensar(alertaId);
  }

  return (
    <div className="vidro-card flex flex-col rounded-[20px]">
      {alertas.map((alerta, indice) => {
        const Icone = ICONE_POR_TIPO[alerta.tipo];
        const meta = extrairMetadata(alerta.metadata);

        return (
          <div
            key={alerta.id}
            className={cn(
              "flex flex-col gap-3 p-4",
              indice > 0 && "border-t border-white/[0.08]",
            )}
          >
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary-forte">
                <Icone className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </span>
              <p className="flex-1 text-[15px] leading-snug text-escuro">
                {alerta.mensagem}
              </p>
              <button
                type="button"
                aria-label="Dispensar alerta"
                onClick={() => onDispensar(alerta.id)}
                className="flex-shrink-0 text-neutro-muted transition-colors hover:text-escuro"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="ml-12 flex flex-wrap gap-2">
              {alerta.tipo === "sem_venda" && (
                <>
                  <BotaoAcao
                    label="Registrar venda"
                    onClick={() => router.push("/financeiro/nova-entrada")}
                  />
                  <BotaoAcao
                    label="Sim, foi assim"
                    secundario
                    onClick={() => onDispensar(alerta.id)}
                  />
                </>
              )}

              {alerta.tipo === "agendamento_pendente" && (
                <>
                  <BotaoAcao
                    label="Ver agendamentos"
                    onClick={() => router.push("/agenda")}
                  />
                  <BotaoAcao
                    label="Já atualizei"
                    secundario
                    onClick={() => onDispensar(alerta.id)}
                  />
                </>
              )}

              {alerta.tipo === "conta_vencida" && meta.transacaoId && (
                <>
                  <BotaoAcao
                    label="Marcar como paga"
                    onClick={() =>
                      marcarContaComoPaga(meta.transacaoId!, alerta.id)
                    }
                  />
                  <BotaoAcao
                    label="Ver detalhes"
                    secundario
                    onClick={() =>
                      router.push(`/financeiro/${meta.transacaoId}`)
                    }
                  />
                </>
              )}

              {alerta.tipo === "meta_risco" && (
                <BotaoAcao
                  label="Ver faturamento"
                  onClick={() => router.push("/faturamento")}
                />
              )}

              {alerta.tipo === "cliente_sumiu" && meta.clienteId && (
                <BotaoAcao
                  label="Ver cliente"
                  onClick={() => router.push(`/clientes/${meta.clienteId}`)}
                />
              )}

              {alerta.tipo === "estoque_baixo" && meta.produtoId && (
                <BotaoAcao
                  label="Ver produto"
                  onClick={() => router.push(`/produtos/${meta.produtoId}`)}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BotaoAcao({
  label,
  secundario = false,
  onClick,
}: {
  label: string;
  secundario?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
        secundario
          ? "vidro-card text-neutro-muted"
          : "bg-primary/20 text-primary-forte",
      )}
    >
      {label}
    </button>
  );
}
