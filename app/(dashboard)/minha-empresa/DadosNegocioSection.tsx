"use client";

import { useState, type ChangeEvent } from "react";
import { Building2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/useToast";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import {
  IDS_TIPO_NEGOCIO_CONHECIDOS,
  OPCOES_TIPO_NEGOCIO,
} from "@/lib/tipos-negocio";
import { SectionCard } from "./SectionCard";
import type { Empresa } from "@/types";
import type { Json } from "@/types/database";

interface DiaHorario {
  aberto: boolean;
  abre: string;
  fecha: string;
}

type HorarioFuncionamento = Record<string, DiaHorario>;

const DIAS = [
  { chave: "seg", label: "Segunda" },
  { chave: "ter", label: "Terça" },
  { chave: "qua", label: "Quarta" },
  { chave: "qui", label: "Quinta" },
  { chave: "sex", label: "Sexta" },
  { chave: "sab", label: "Sábado" },
  { chave: "dom", label: "Domingo" },
] as const;

function horarioPadrao(): HorarioFuncionamento {
  const padrao: HorarioFuncionamento = {};
  for (const dia of DIAS) {
    padrao[dia.chave] = {
      aberto: dia.chave !== "dom",
      abre: "09:00",
      fecha: "18:00",
    };
  }
  return padrao;
}

export function DadosNegocioSection({
  empresa,
  onAtualizado,
}: {
  empresa: Empresa;
  onAtualizado: (empresa: Empresa) => void;
}) {
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());

  const tipoConhecido =
    empresa.tipo_negocio !== null &&
    IDS_TIPO_NEGOCIO_CONHECIDOS.includes(empresa.tipo_negocio);

  const [nome, setNome] = useState(empresa.nome);
  const [tipoSelecionado, setTipoSelecionado] = useState(
    tipoConhecido ? empresa.tipo_negocio! : empresa.tipo_negocio ? "outro" : "",
  );
  const [outroTexto, setOutroTexto] = useState(
    !tipoConhecido && empresa.tipo_negocio ? empresa.tipo_negocio : "",
  );
  const [telefone, setTelefone] = useState(empresa.telefone ?? "");
  const [endereco, setEndereco] = useState(empresa.endereco ?? "");
  const [logoUrl, setLogoUrl] = useState(empresa.logo_url);
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [horario, setHorario] = useState<HorarioFuncionamento>(
    (empresa.horario_funcionamento as HorarioFuncionamento | null) ??
      horarioPadrao(),
  );
  const [salvando, setSalvando] = useState(false);

  async function handleUploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;

    setEnviandoLogo(true);
    const extensao = arquivo.name.split(".").pop() ?? "png";
    const caminho = `${empresa.id}/logo-${Date.now()}.${extensao}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(caminho, arquivo, { upsert: true });

    if (uploadError) {
      setEnviandoLogo(false);
      showToast("Não consegui enviar a imagem.");
      return;
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(caminho);
    const { error: updateError } = await supabase
      .from("empresas")
      .update({ logo_url: data.publicUrl })
      .eq("id", empresa.id);

    setEnviandoLogo(false);

    if (updateError) {
      showToast("Logo enviada, mas não consegui salvar.");
      return;
    }

    setLogoUrl(data.publicUrl);
    onAtualizado({ ...empresa, logo_url: data.publicUrl });
    showToast("Logo atualizada!");
  }

  function alternarDia(chave: string) {
    setHorario((atual) => ({
      ...atual,
      [chave]: { ...atual[chave]!, aberto: !atual[chave]!.aberto },
    }));
  }

  function mudarHorarioDia(
    chave: string,
    campo: "abre" | "fecha",
    valor: string,
  ) {
    setHorario((atual) => ({
      ...atual,
      [chave]: { ...atual[chave]!, [campo]: valor },
    }));
  }

  async function handleSalvar() {
    const tipoFinal =
      tipoSelecionado === "outro" ? outroTexto.trim() : tipoSelecionado;
    setSalvando(true);

    const patch = {
      nome: nome.trim(),
      tipo_negocio: tipoFinal || null,
      telefone: telefone.trim() || null,
      endereco: endereco.trim() || null,
      horario_funcionamento: horario as unknown as Json,
    };

    const { error } = await supabase
      .from("empresas")
      .update(patch)
      .eq("id", empresa.id);

    setSalvando(false);

    if (error) {
      showToast("Não consegui salvar. Tenta de novo.");
      return;
    }

    onAtualizado({ ...empresa, ...patch });
    showToast("Dados do negócio atualizados!");
  }

  return (
    <SectionCard icone={Building2} titulo="Dados do negócio">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-neutro-border bg-fundo">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoUrl}
                alt="Logo do negócio"
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2
                className="h-6 w-6 text-neutro-muted"
                strokeWidth={2}
              />
            )}
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-button border border-neutro-border px-3.5 py-2 text-xs font-semibold text-escuro transition-colors hover:bg-fundo">
            <Upload className="h-3.5 w-3.5" strokeWidth={2.25} />
            {enviandoLogo ? "Enviando..." : "Trocar logo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUploadLogo}
              disabled={enviandoLogo}
            />
          </label>
        </div>

        <Input
          label="Nome do negócio"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <div>
          <p className="mb-2 text-xs font-semibold text-neutro-muted">
            Tipo de negócio
          </p>
          <div className="flex flex-wrap gap-2">
            {OPCOES_TIPO_NEGOCIO.map((opcao) => (
              <button
                key={opcao.id}
                type="button"
                onClick={() => setTipoSelecionado(opcao.id)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  tipoSelecionado === opcao.id
                    ? "border-primary-forte bg-primary text-primary-text"
                    : "border-neutro-border bg-superficie text-escuro"
                }`}
              >
                <opcao.icone className="h-3.5 w-3.5" strokeWidth={2.25} />
                {opcao.label}
              </button>
            ))}
          </div>
          {tipoSelecionado === "outro" && (
            <div className="mt-3">
              <Input
                label="Conte pra gente"
                value={outroTexto}
                onChange={(e) => setOutroTexto(e.target.value)}
                placeholder="Ex.: Estúdio de tatuagem"
              />
            </div>
          )}
        </div>

        <Input
          label="Telefone de contato"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          placeholder="(11) 91234-5678"
        />
        <Input
          label="Endereço"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          placeholder="Rua, número, bairro"
        />

        <div>
          <p className="mb-2 text-xs font-semibold text-neutro-muted">
            Horário de funcionamento
          </p>
          <div className="flex flex-col gap-2">
            {DIAS.map((dia) => {
              const dh = horario[dia.chave] ?? {
                aberto: false,
                abre: "09:00",
                fecha: "18:00",
              };
              return (
                <div
                  key={dia.chave}
                  className="flex items-center gap-3 rounded-button border border-neutro-border p-2.5"
                >
                  <Toggle
                    checked={dh.aberto}
                    onChange={() => alternarDia(dia.chave)}
                    label={dia.label}
                  />
                  <span className="w-16 flex-shrink-0 text-sm text-escuro">
                    {dia.label}
                  </span>
                  {dh.aberto ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type="time"
                        value={dh.abre}
                        onChange={(e) =>
                          mudarHorarioDia(dia.chave, "abre", e.target.value)
                        }
                        className="w-full rounded-button border border-neutro-border bg-fundo px-2 py-1.5 text-base text-escuro outline-none focus:border-primary-forte md:text-xs"
                      />
                      <span className="text-xs text-neutro-muted">até</span>
                      <input
                        type="time"
                        value={dh.fecha}
                        onChange={(e) =>
                          mudarHorarioDia(dia.chave, "fecha", e.target.value)
                        }
                        className="w-full rounded-button border border-neutro-border bg-fundo px-2 py-1.5 text-base text-escuro outline-none focus:border-primary-forte md:text-xs"
                      />
                    </div>
                  ) : (
                    <span className="flex-1 text-xs text-neutro-muted">
                      Fechado
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <Button onClick={handleSalvar} disabled={salvando || !nome.trim()}>
          {salvando ? "Salvando..." : "Salvar alterações"}
        </Button>
      </div>
    </SectionCard>
  );
}
