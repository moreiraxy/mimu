"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastItem {
  id: string;
  mensagem: string;
  icone?: LucideIcon;
  saindo: boolean;
}

export interface ToastContextValue {
  showToast: (mensagem: string, icone?: LucideIcon) => void;
}

export const ToastContext = createContext<ToastContextValue | undefined>(
  undefined,
);

const DURACAO_MS = 3000;
const TRANSICAO_MS = 180;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((mensagem: string, icone?: LucideIcon) => {
    const id = crypto.randomUUID();
    setToasts((atual) => [...atual, { id, mensagem, icone, saindo: false }]);

    setTimeout(() => {
      setToasts((atual) =>
        atual.map((t) => (t.id === id ? { ...t, saindo: true } : t)),
      );
      setTimeout(() => {
        setToasts((atual) => atual.filter((t) => t.id !== id));
      }, TRANSICAO_MS);
    }, DURACAO_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(116px+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <ToastBubble key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Entra um frame depois do mount (senão a transição não dispara) e sai controlada pelo `saindo` do provider. */
function ToastBubble({ toast }: { toast: ToastItem }) {
  const [entrou, setEntrou] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntrou(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const visivel = entrou && !toast.saindo;

  /*
   * `text-fundo` e não `text-white`. O fundo do aviso é `escuro`, que inverte
   * com o tema: no tema escuro ele é branco, e o texto branco por cima ficava
   * invisível. Toda mensagem do app passa por aqui, inclusive "Não consegui
   * salvar", então isso significava erro que ninguém lia.
   */
  return (
    <div
      className={cn(
        "pointer-events-auto flex w-full max-w-[380px] items-center justify-center gap-2 rounded-button bg-escuro px-4 py-3 text-center text-sm font-medium text-fundo shadow-lg transition-[transform,opacity] duration-[180ms] ease-out motion-reduce:duration-100",
        visivel
          ? "translate-y-0 opacity-100"
          : "translate-y-2 opacity-0 motion-reduce:translate-y-0",
      )}
    >
      {toast.icone && (
        <toast.icone className="h-4 w-4 flex-shrink-0" strokeWidth={2.25} />
      )}
      {toast.mensagem}
    </div>
  );
}
