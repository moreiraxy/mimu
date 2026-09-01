"use client";

import { useEffect, useState } from "react";
import { Check, Target, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { calcularMetaDiaria, formatCurrency } from "@/lib/formatters";
import { SectionCard } from "./SectionCard";
import type { Empresa } from "@/types";

const NOMES_MES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

interface LinhaHistorico {
  mes: number;
  ano: number;
  meta: number | null;
  realizado: number;
}

function formatarCentavos(centavos: number) {
  return formatCurrency(centavos / 100);
}

export function MetaSection({
  empresa,
  onAtualizado,
}: {
  empresa: Empresa;
  onAtualizado: (empresa: Empresa) => void;
}) {
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());
  const [centavos, setCentavos] = useState(
    empresa.meta_mensal ? Math.round(empresa.meta_mensal * 100) : 0,
  );
  const [salvando, setSalvando] = useState(false);
  const [historico, setHistorico] = useState<LinhaHistorico[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);

  const metaMensal = centavos / 100;
  const metaDiaria = metaMensal > 0 ? calcularMetaDiaria(metaMensal) : 0;

  useEffect(() => {
    async function carregar() {
      setCarregandoHistorico(true);
      const agora = new Date();
      const seisMesesAtras = new Date(
        agora.getFullYear(),
        agora.getMonth() - 5,
        1,
      );

      const [metasResult, transacoesResult] = await Promise.all([
        supabase
          .from("metas")
          .select("mes, ano, valor_meta")
          .eq("empresa_id", empresa.id)
          .order("ano", { ascending: false })
          .order("mes", { ascending: false })
          .limit(12),
        supabase
          .from("transacoes")
          .select("data, valor")
          .eq("empresa_id", empresa.id)
          .eq("tipo", "entrada")
          .gte("data", seisMesesAtras.toISOString().slice(0, 10)),
      ]);

      const metasPorChave = new Map(
        (metasResult.data ?? []).map((m) => [
          `${m.ano}-${m.mes}`,
          m.valor_meta,
        ]),
      );
      const transacoes = transacoesResult.data ?? [];

      const linhas: LinhaHistorico[] = [];
      for (let i = 0; i < 6; i++) {
        const data = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
        const mes = data.getMonth() + 1;
        const ano = data.getFullYear();
        const realizado = transacoes
          .filter((t) => {
            const d = new Date(`${t.data}T00:00:00`);
            return d.getFullYear() === ano && d.getMonth() + 1 === mes;
          })
          .reduce((soma, t) => soma + Number(t.valor), 0);

        linhas.push({
          mes,
          ano,
          meta: metasPorChave.get(`${ano}-${mes}`) ?? null,
          realizado,
        });
      }

      setHistorico(linhas);
      setCarregandoHistorico(false);
    }

    carregar();
  }, [empresa.id, supabase]);

  async function handleSalvar() {
    setSalvando(true);
    const novaMetaDiaria =
      metaMensal > 0 ? calcularMetaDiaria(metaMensal) : null;

    const { error } = await supabase
      .from("empresas")
      .update({
        meta_mensal: metaMensal > 0 ? metaMensal : null,
        meta_diaria: novaMetaDiaria,
      })
      .eq("id", empresa.id);

    if (error) {
      setSalvando(false);
      showToast("Não consegui salvar a meta.");
      return;
    }

    if (metaMensal > 0) {
      const agora = new Date();
      await supabase.from("metas").upsert(
        {
          empresa_id: empresa.id,
          mes: agora.getMonth() + 1,
          ano: agora.getFullYear(),
          valor_meta: metaMensal,
        },
        { onConflict: "empresa_id,mes,ano" },
      );
    }

    setSalvando(false);
    onAtualizado({
      ...empresa,
      meta_mensal: metaMensal > 0 ? metaMensal : null,
      meta_diaria: novaMetaDiaria,
    });
    showToast("Meta atualizada!");
  }

  return (
    <SectionCard icone={Target} titulo="Meta de faturamento">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center">
          <p className="mb-2 text-xs font-semibold text-neutro-muted">
            Meta mensal
          </p>
          <input
            type="text"
            inputMode="numeric"
            value={formatarCentavos(centavos)}
            onChange={(e) => {
              const digitos = e.target.value.replace(/\D/g, "");
              setCentavos(digitos ? Number(digitos) : 0);
            }}
            aria-label="Meta mensal"
            className="w-full max-w-[240px] rounded-button border border-neutro-border bg-white/[0.04] px-4 py-3 text-center text-2xl font-semibold text-primary-forte outline-none focus:border-primary-forte"
          />
          {metaMensal > 0 && (
            <p className="mt-2 text-xs text-neutro-muted">
              Meta diária:{" "}
              <span className="font-semibold text-escuro">
                {formatCurrency(metaDiaria)}
              </span>
            </p>
          )}
        </div>

        <Button onClick={handleSalvar} disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar meta"}
        </Button>

        <div>
          <p className="mb-2 text-xs font-semibold text-neutro-muted">
            Últimos 6 meses
          </p>
          {carregandoHistorico ? (
            <p className="text-xs text-neutro-muted">Carregando...</p>
          ) : (
            <div className="flex flex-col divide-y divide-neutro-border rounded-button border border-neutro-border">
              {historico.map((linha) => {
                const bateu =
                  linha.meta !== null && linha.realizado >= linha.meta;
                return (
                  <div
                    key={`${linha.ano}-${linha.mes}`}
                    className="flex flex-col gap-1 px-3.5 py-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-escuro">
                        {NOMES_MES[linha.mes - 1]} {linha.ano}
                      </span>
                      {linha.meta !== null ? (
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            bateu
                              ? "bg-verde-light text-verde-texto"
                              : "bg-erro-light text-erro-texto"
                          }`}
                        >
                          {bateu ? (
                            <Check className="h-3 w-3" strokeWidth={2.5} />
                          ) : (
                            <X className="h-3 w-3" strokeWidth={2.5} />
                          )}
                          {bateu ? "Bateu" : "Não bateu"}
                        </span>
                      ) : (
                        <span className="text-[11px] text-neutro-muted">
                          Sem meta
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutro-muted">
                      <span>
                        Meta:{" "}
                        {linha.meta !== null
                          ? formatCurrency(linha.meta)
                          : "—"}
                      </span>
                      <span>Realizado: {formatCurrency(linha.realizado)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
