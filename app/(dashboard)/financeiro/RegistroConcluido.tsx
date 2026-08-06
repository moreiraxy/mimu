"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const COMPRIMENTO_CHECK = 28;

export function RegistroConcluido({
  titulo,
  subtitulo,
  onNovo,
}: {
  titulo: string;
  subtitulo?: string;
  onNovo: () => void;
}) {
  const router = useRouter();
  const [animado, setAnimado] = useState(false);

  // Momento raro (fim de um registro) — é onde vale gastar um pouco mais:
  // círculo entra com leve overshoot, e o check "desenha" logo em seguida.
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setAnimado(true)),
    );
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 text-center">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full bg-verde-light transition-[transform,opacity] duration-[350ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:duration-150 motion-reduce:ease-out",
          animado ? "scale-100 opacity-100" : "scale-75 opacity-0",
        )}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 12 L9 17 L20 6"
            stroke="#2DBE8C"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={COMPRIMENTO_CHECK}
            strokeDashoffset={animado ? 0 : COMPRIMENTO_CHECK}
            className="transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:duration-150"
            style={{ transitionDelay: animado ? "150ms" : "0ms" }}
          />
        </svg>
      </div>
      <p className="text-lg font-semibold text-escuro">{titulo}</p>
      {subtitulo && (
        <p className="-mt-3 max-w-[280px] text-sm text-neutro-muted">
          {subtitulo}
        </p>
      )}

      <div className="flex w-full max-w-[280px] flex-col gap-2.5">
        <Button className="w-full" onClick={onNovo}>
          Registrar outro
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => router.push("/financeiro")}
        >
          Voltar para o financeiro
        </Button>
      </div>
    </div>
  );
}
