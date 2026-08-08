"use client";

import { useState } from "react";
import { Moon, Settings2, Sun } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { useTema } from "@/hooks/useTema";
import { Toggle } from "@/components/ui/Toggle";
import { lerConfigAlertas } from "@/lib/config-alertas";
import { SectionCard } from "./SectionCard";
import type { Empresa, ConfigAlertas } from "@/types";
import type { Json } from "@/types/database";

const HORAS = Array.from({ length: 24 }, (_, h) => h);

export function PreferenciasSection({
  empresa,
  onAtualizado,
}: {
  empresa: Empresa;
  onAtualizado: (empresa: Empresa) => void;
}) {
  const { tema, alternarTema } = useTema();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());
  const [config, setConfig] = useState<ConfigAlertas>(() =>
    lerConfigAlertas(empresa.config_alertas),
  );

  async function salvarConfig(novaConfig: ConfigAlertas) {
    setConfig(novaConfig);
    const { error } = await supabase
      .from("empresas")
      .update({ config_alertas: novaConfig as unknown as Json })
      .eq("id", empresa.id);

    if (error) {
      showToast("Não consegui salvar as notificações.");
      return;
    }
    onAtualizado({ ...empresa, config_alertas: novaConfig as unknown as Json });
  }

  return (
    <SectionCard icone={Settings2} titulo="Preferências">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between rounded-button border border-neutro-border p-3.5">
          <div className="flex items-center gap-2.5">
            {tema === "escuro" ? (
              <Moon className="h-4 w-4 text-neutro-muted-strong" strokeWidth={2.25} />
            ) : (
              <Sun className="h-4 w-4 text-neutro-muted-strong" strokeWidth={2.25} />
            )}
            <div>
              <p className="text-sm font-semibold text-escuro">
                {tema === "escuro" ? "Tema escuro" : "Tema claro"}
              </p>
              <p className="text-xs text-neutro-muted">
                Muda a aparência do app inteiro.
              </p>
            </div>
          </div>
          <Toggle checked={tema === "escuro"} onChange={alternarTema} label="Tema escuro" />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-neutro-muted">
            Alertas da Mimu
          </p>
          <div className="flex flex-col divide-y divide-neutro-border rounded-button border border-neutro-border">
            <LinhaAlerta
              titulo="Sem venda no dia"
              descricao="Avisa se você ainda não registrou nenhuma venda"
              valor={config.sem_venda}
              onChange={(v) => salvarConfig({ ...config, sem_venda: v })}
            />
            <LinhaAlerta
              titulo="Agendamentos pendentes"
              descricao="Avisa se tem atendimento sem marcar como concluído"
              valor={config.agendamento_pendente}
              onChange={(v) =>
                salvarConfig({ ...config, agendamento_pendente: v })
              }
            />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function LinhaAlerta({
  titulo,
  descricao,
  valor,
  onChange,
}: {
  titulo: string;
  descricao: string;
  valor: { ativo: boolean; hora: number };
  onChange: (v: { ativo: boolean; hora: number }) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 px-3.5 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-escuro">{titulo}</p>
          <p className="text-xs text-neutro-muted">{descricao}</p>
        </div>
        <Toggle
          checked={valor.ativo}
          onChange={(ativo) => onChange({ ...valor, ativo })}
          label={titulo}
        />
      </div>
      {valor.ativo && (
        <label className="flex items-center gap-2 text-xs text-neutro-muted">
          A partir de
          <select
            value={valor.hora}
            onChange={(e) => onChange({ ...valor, hora: Number(e.target.value) })}
            className="rounded-button border border-neutro-border bg-fundo px-2 py-1.5 text-base text-escuro outline-none focus:border-coral md:text-xs"
          >
            {HORAS.map((h) => (
              <option key={h} value={h}>
                {String(h).padStart(2, "0")}h
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
