"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import type { AlertaMimu } from "@/types";

const INTERVALO_MS = 30 * 60 * 1000;

export interface AlertasContextValue {
  alertas: AlertaMimu[];
  loading: boolean;
  dispensar: (id: string) => void;
  verificarAgora: () => void;
}

export const AlertasContext = createContext<AlertasContextValue | undefined>(
  undefined,
);

/**
 * Notificação local (foreground) via Web Notification API — dispara enquanto
 * o app está aberto/em foco, que é exatamente quando checkAlertas roda. Push
 * de verdade em background (service worker + VAPID) é um projeto à parte.
 */
function dispararNotificacoes(novos: AlertaMimu[]) {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "default") {
    Notification.requestPermission();
    return;
  }
  if (Notification.permission !== "granted") return;

  for (const alerta of novos) {
    new Notification("Mimu", {
      body: alerta.mensagem ?? "",
      icon: "/icon.svg",
      tag: alerta.id,
    });
  }
}

export function AlertasProvider({ children }: { children: ReactNode }) {
  const { empresa } = useEmpresa();
  const [supabase] = useState(() => createClient());
  const [alertas, setAlertas] = useState<AlertaMimu[]>([]);
  const [loading, setLoading] = useState(true);
  const verificandoRef = useRef(false);

  const verificar = useCallback(async () => {
    if (!empresa || verificandoRef.current) return;
    verificandoRef.current = true;

    try {
      const resposta = await fetch("/api/mimu/proativo", { method: "POST" });
      if (!resposta.ok) return;

      const dados = await resposta.json();
      setAlertas(dados.naoLidos ?? []);
      if (dados.novos?.length > 0) {
        dispararNotificacoes(dados.novos);
      }
    } catch {
      // alertas proativos são um extra — não podem travar o resto do app
    } finally {
      verificandoRef.current = false;
      setLoading(false);
    }
  }, [empresa]);

  // Checa ao carregar (assim que a empresa está disponível).
  useEffect(() => {
    if (empresa) {
      verificar();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa?.id]);

  // A cada 30min de app aberto, e sempre que a aba volta a ficar em foco.
  useEffect(() => {
    if (!empresa) return;

    const intervalId = setInterval(verificar, INTERVALO_MS);
    function aoFocar() {
      verificar();
    }
    window.addEventListener("focus", aoFocar);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", aoFocar);
    };
  }, [empresa, verificar]);

  const dispensar = useCallback(
    async (id: string) => {
      setAlertas((atual) => atual.filter((a) => a.id !== id));
      await supabase.from("alertas_mimu").update({ lido: true }).eq("id", id);
    },
    [supabase],
  );

  return (
    <AlertasContext.Provider
      value={{ alertas, loading, dispensar, verificarAgora: verificar }}
    >
      {children}
    </AlertasContext.Provider>
  );
}
