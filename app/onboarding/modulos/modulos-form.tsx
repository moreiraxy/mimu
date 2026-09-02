"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { salvarModulos } from "../actions";
import { OptionCard } from "@/components/onboarding/OptionCard";
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress";
import { Button } from "@/components/ui/Button";
import {
  MODULOS,
  PRESELECAO_MODULOS,
  PRESELECAO_MODULOS_PADRAO,
  cartaoIdsParaChaves,
  chavesParaCartaoIds,
} from "@/lib/modulos";

export function ModulosForm({
  tipoNegocio,
  modulosAtuais,
}: {
  tipoNegocio: string;
  modulosAtuais: string[];
}) {
  const [selecionados, setSelecionados] = useState<string[]>(() =>
    modulosAtuais.length > 0
      ? chavesParaCartaoIds(modulosAtuais)
      : (PRESELECAO_MODULOS[tipoNegocio] ?? PRESELECAO_MODULOS_PADRAO),
  );
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id],
    );
  }

  function handleContinuar() {
    if (selecionados.length === 0) return;
    setErro(null);
    startTransition(async () => {
      const resultado = await salvarModulos(
        cartaoIdsParaChaves(selecionados),
      );
      if (resultado?.error) setErro(resultado.error);
    });
  }

  return (
    <div>
      <Link
        href="/onboarding/negocio"
        className="mb-4 inline-block text-[15px] text-neutro-muted"
      >
        ← Voltar
      </Link>
      <OnboardingProgress step={2} />
      <h1 className="text-[24px] font-bold leading-tight tracking-tight text-escuro">
        O que você quer controlar?
      </h1>
      <p className="mt-1 text-[15px] text-neutro-muted">
        Você pode ativar ou desativar qualquer módulo depois.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {MODULOS.map((modulo) => (
          <OptionCard
            key={modulo.id}
            icon={modulo.icone}
            label={modulo.label}
            description={modulo.descricao}
            selected={selecionados.includes(modulo.id)}
            showCheck
            onClick={() => toggle(modulo.id)}
          />
        ))}
      </div>

      {erro && (
        <p className="mt-4 rounded-[14px] border-l-[3px] border-white/25 bg-white/[0.06] py-2.5 pl-3 pr-3 text-[13px] leading-snug text-escuro">
          {erro}
        </p>
      )}

      <Button
        type="button"
        className="mt-6 w-full"
        disabled={selecionados.length === 0 || pending}
        onClick={handleContinuar}
      >
        {pending ? "Salvando..." : "Continuar"}
      </Button>
    </div>
  );
}
