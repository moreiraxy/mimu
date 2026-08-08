"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { inscreverPush } from "@/lib/push-client";

const CHAVE_LOCALSTORAGE = "mimu_push_prompt_respondido";

/**
 * Pedido de permissão de push com a voz da Mimu, depois do primeiro login.
 * Só aparece uma vez — "Agora não" ou "Sim, quero" marcam a flag e o prompt
 * não volta a insistir, mesmo em sessões futuras.
 */
export function PushPermissionPrompt() {
  const { user } = useAuth();
  const [visivel, setVisivel] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
    if (Notification.permission !== "default") return;
    if (localStorage.getItem(CHAVE_LOCALSTORAGE)) return;

    const timer = setTimeout(() => setVisivel(true), 1500);
    return () => clearTimeout(timer);
  }, [user]);

  function fechar() {
    localStorage.setItem(CHAVE_LOCALSTORAGE, "1");
    setVisivel(false);
  }

  async function aceitar() {
    setEnviando(true);
    try {
      const permissao = await Notification.requestPermission();
      if (permissao === "granted") {
        await inscreverPush();
      }
    } catch {
      // se a inscrição falhar, a usuária simplesmente não recebe push — sem travar o app.
    } finally {
      setEnviando(false);
      fechar();
    }
  }

  if (!visivel) return null;

  return (
    // Ancorado embaixo (acima da bottom nav + FAB, mesmo cálculo de
    // segurança que o Fab.tsx usa) em vez de no topo — no topo ele cobria o
    // início do conteúdo de toda página autenticada por vários segundos
    // (data da agenda, botões de entrada/saída, campos de formulário).
    <div className="fixed inset-x-4 bottom-[calc(64px+env(safe-area-inset-bottom)+16px)] z-40 mx-auto flex max-w-[380px] items-start gap-3 rounded-card border border-neutro-border bg-superficie p-4 shadow-lg md:bottom-6 md:left-auto md:right-6 md:mx-0">
      <LogoMark size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-escuro">
          Posso te avisar quando algo importante acontecer no seu negócio?
        </p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={aceitar} disabled={enviando}>
            {enviando ? "Um instante..." : "Sim, quero"}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={fechar}
            disabled={enviando}
          >
            Agora não
          </Button>
        </div>
      </div>
    </div>
  );
}
