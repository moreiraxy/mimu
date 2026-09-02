"use client";

import { useState, useTransition } from "react";
import { salvarNegocio } from "../actions";
import { OptionCard } from "@/components/onboarding/OptionCard";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  IDS_TIPO_NEGOCIO_CONHECIDOS,
  OPCOES_TIPO_NEGOCIO,
} from "@/lib/tipos-negocio";

export function NegocioForm({
  tipoNegocioAtual,
}: {
  tipoNegocioAtual: string | null;
}) {
  const negocioConhecido =
    tipoNegocioAtual !== null &&
    IDS_TIPO_NEGOCIO_CONHECIDOS.includes(tipoNegocioAtual);

  const [selecionado, setSelecionado] = useState<string | null>(
    negocioConhecido ? tipoNegocioAtual : tipoNegocioAtual ? "outro" : null,
  );
  const [outroTexto, setOutroTexto] = useState(
    !negocioConhecido && tipoNegocioAtual ? tipoNegocioAtual : "",
  );
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const valorFinal = selecionado === "outro" ? outroTexto.trim() : selecionado;
  const podeContinuar =
    selecionado !== null &&
    (selecionado !== "outro" || outroTexto.trim().length > 0);

  function handleContinuar() {
    if (!podeContinuar || !valorFinal) return;
    setErro(null);
    startTransition(async () => {
      const resultado = await salvarNegocio(valorFinal);
      if (resultado?.error) setErro(resultado.error);
    });
  }

  return (
    <div>
      <OnboardingProgress step={1} />
      <h1 className="text-[24px] font-bold leading-tight tracking-tight text-escuro">
        Qual é o seu negócio?
      </h1>
      <p className="mt-1 text-[15px] text-neutro-muted">
        Vamos deixar tudo do jeito certo para você.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {OPCOES_TIPO_NEGOCIO.map((opcao) => (
          <OptionCard
            key={opcao.id}
            icon={opcao.icone}
            label={opcao.label}
            selected={selecionado === opcao.id}
            onClick={() => setSelecionado(opcao.id)}
          />
        ))}
      </div>

      {selecionado === "outro" && (
        <div className="mt-4">
          <Input
            label="Conte pra gente"
            name="negocio_outro"
            placeholder="Ex.: Estúdio de tatuagem"
            value={outroTexto}
            onChange={(event) => setOutroTexto(event.target.value)}
            autoFocus
          />
        </div>
      )}

      {erro && (
        <p className="mt-4 rounded-[14px] border-l-[3px] border-white/25 bg-white/[0.06] py-2.5 pl-3 pr-3 text-[13px] leading-snug text-escuro">
          {erro}
        </p>
      )}

      <Button
        type="button"
        className="mt-6 w-full"
        disabled={!podeContinuar || pending}
        onClick={handleContinuar}
      >
        {pending ? "Salvando..." : "Continuar"}
      </Button>
    </div>
  );
}
