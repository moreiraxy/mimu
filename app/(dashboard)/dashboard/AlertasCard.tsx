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
import { useToast } from "@/hooks/useToast";
import type { AlertaMimu, TipoAlerta } from "@/types";
import type { AlertaMetadata } from "@/lib/mimu-prompts";

const ICONE_POR_TIPO: Record<TipoAlerta, { icone: LucideIcon; bg: string }> = {
  sem_venda: { icone: Bell, bg: "bg-ambar" },
  agendamento_pendente: { icone: CalendarClock, bg: "bg-ambar" },
  conta_vencida: { icone: AlertTriangle, bg: "bg-erro" },
  meta_risco: { icone: TrendingDown, bg: "bg-ambar" },
  recorde: { icone: Trophy, bg: "bg-primary" },
  cliente_sumiu: { icone: UserX, bg: "bg-ambar" },
  estoque_baixo: { icone: Package, bg: "bg-ambar" },
  tentativa_prompt_injection: { icone: ShieldAlert, bg: "bg-erro" },
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
    <div className="flex flex-col gap-3 rounded-card bg-[#FFF8EE] p-4">
      {alertas.map((alerta) => {
        const { icone: Icone, bg } = ICONE_POR_TIPO[alerta.tipo];
        const meta = extrairMetadata(alerta.metadata);

        return (
          <div
            key={alerta.id}
            className="flex flex-col gap-2.5 border-b border-ambar/20 pb-3 last:border-0 last:pb-0"
          >
            <div className="flex items-start gap-2.5">
              <span
                className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-white ${bg}`}
              >
                <Icone className="h-3.5 w-3.5" strokeWidth={2.25} />
              </span>
              <p className="flex-1 text-sm text-escuro">{alerta.mensagem}</p>
              <button
                type="button"
                aria-label="Dispensar alerta"
                onClick={() => onDispensar(alerta.id)}
                className="flex-shrink-0 text-neutro-muted transition-colors hover:text-neutro-muted-strong"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>

            <div className="ml-[34px] flex flex-wrap gap-2">
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
      className={
        secundario
          ? "rounded-full border border-neutro-border bg-superficie px-3 py-1.5 text-xs font-semibold text-neutro-muted-strong transition-colors hover:bg-fundo"
          : "rounded-full bg-ambar px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ambar-dark"
      }
    >
      {label}
    </button>
  );
}
