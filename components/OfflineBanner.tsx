"use client";

import { WifiOff } from "lucide-react";
import { useOffline } from "@/hooks/useOffline";

export function OfflineBanner() {
  const { online } = useOffline();

  if (online) return null;

  return (
    <div
      className="sticky top-0 z-[100] flex items-center justify-center gap-2 bg-ambar px-4 py-2 text-center text-xs font-semibold text-white"
      /*
       * Aqui o safe-area entra como PADDING, e não como `top`: esta é uma
       * faixa preenchida, e faixa preenchida no iOS vai até a borda de cima —
       * o âmbar precisa aparecer atrás do relógio, senão sobra uma tira preta
       * acima dela. O que desce é só o texto.
       */
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 0.5rem)" }}
    >
      <WifiOff className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={2.25} />
      Você está sem conexão. Seus dados serão salvos quando voltar.
    </div>
  );
}
