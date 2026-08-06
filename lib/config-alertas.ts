import type { ConfigAlertas } from "@/types";
import type { Json } from "@/types/database";

export const CONFIG_ALERTAS_PADRAO: ConfigAlertas = {
  sem_venda: { ativo: true, hora: 17 },
  agendamento_pendente: { ativo: true, hora: 19 },
};

/** Lê `empresas.config_alertas`, preenchendo com o padrão qualquer campo ausente. */
export function lerConfigAlertas(valor: Json | null | undefined): ConfigAlertas {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) {
    return CONFIG_ALERTAS_PADRAO;
  }
  const bruto = valor as Record<string, { ativo?: boolean; hora?: number }>;
  return {
    sem_venda: {
      ativo: bruto.sem_venda?.ativo ?? CONFIG_ALERTAS_PADRAO.sem_venda.ativo,
      hora: bruto.sem_venda?.hora ?? CONFIG_ALERTAS_PADRAO.sem_venda.hora,
    },
    agendamento_pendente: {
      ativo:
        bruto.agendamento_pendente?.ativo ??
        CONFIG_ALERTAS_PADRAO.agendamento_pendente.ativo,
      hora:
        bruto.agendamento_pendente?.hora ??
        CONFIG_ALERTAS_PADRAO.agendamento_pendente.hora,
    },
  };
}
