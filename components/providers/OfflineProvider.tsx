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
import { useToast } from "@/hooks/useToast";
import { contarPendentes } from "@/lib/offline/db";
import { processarFila } from "@/lib/offline/sync";

export interface OfflineContextValue {
  online: boolean;
  pendentes: number;
  sincronizarAgora: () => void;
}

export const OfflineContext = createContext<OfflineContextValue | undefined>(
  undefined,
);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());
  const [online, setOnline] = useState(true);
  const [pendentes, setPendentes] = useState(0);
  const sincronizandoRef = useRef(false);

  const atualizarPendentes = useCallback(async () => {
    setPendentes(await contarPendentes());
  }, []);

  const sincronizar = useCallback(async () => {
    if (sincronizandoRef.current) return;
    sincronizandoRef.current = true;

    try {
      const resultado = await processarFila(supabase);
      if (resultado.processados > 0) {
        showToast(
          resultado.processados === 1
            ? "1 registro sincronizado."
            : `${resultado.processados} registros sincronizados.`,
        );
      }
    } finally {
      sincronizandoRef.current = false;
      atualizarPendentes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, atualizarPendentes]);

  // Registra o service worker (cache offline + push) uma vez, no client — só
  // em produção. Em dev os nomes dos chunks do webpack não são estáveis entre
  // reinícios do servidor, e o SW cacheia "/_next/static/*" com cache-first;
  // isso trava a página com JS antigo (erro de módulo indefinido no webpack)
  // depois do primeiro restart. Sem esse guard, todo `npm run dev` novo corria
  // o risco de ficar "quebrado" pra quem já tinha o SW instalado no navegador.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    if (process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // registro é um bônus progressivo — nunca deve quebrar o app.
      });
      return;
    }

    // Limpa qualquer SW/cache de uma instalação anterior (de antes deste
    // guard existir) — sem isso, quem já tinha o worker antigo continuaria
    // preso nele mesmo com o código já corrigido.
    navigator.serviceWorker.getRegistrations().then((registros) => {
      registros.forEach((registro) => registro.unregister());
    });
    if ("caches" in window) {
      caches.keys().then((chaves) => {
        chaves.forEach((chave) => caches.delete(chave));
      });
    }
  }, []);

  useEffect(() => {
    setOnline(navigator.onLine);
    atualizarPendentes();

    function aoFicarOnline() {
      setOnline(true);
      sincronizar();
    }
    function aoFicarOffline() {
      setOnline(false);
    }

    window.addEventListener("online", aoFicarOnline);
    window.addEventListener("offline", aoFicarOffline);

    if (navigator.onLine) sincronizar();

    return () => {
      window.removeEventListener("online", aoFicarOnline);
      window.removeEventListener("offline", aoFicarOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <OfflineContext.Provider
      value={{ online, pendentes, sincronizarAgora: sincronizar }}
    >
      {children}
    </OfflineContext.Provider>
  );
}
