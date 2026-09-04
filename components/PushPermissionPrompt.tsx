"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LogoMark } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { inscreverPush } from "@/lib/push-client";
import { ehAppIOSNoNavegador } from "@/lib/plataforma";
import { registrarPushNativo } from "@/lib/nativo";

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
    if (typeof window === "undefined") return;
    if (localStorage.getItem(CHAVE_LOCALSTORAGE)) return;

    /*
     * As TRÊS condições abaixo são do Web Push, e nenhuma vale no aplicativo.
     *
     * Elas estavam soltas no topo e desligavam este pedido dentro do app por
     * motivos que não existem lá: a WKWebView não expõe `Notification`, então
     * a primeira já saía; e a chave VAPID é do protocolo do navegador, que o
     * APNs não usa. O resultado é que quem usa o aplicativo — justamente quem
     * mais precisa de aviso, porque não fica com o site aberto — nunca via o
     * pedido.
     */
    if (!ehAppIOSNoNavegador()) {
      if (!("Notification" in window)) return;
      if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
      if (Notification.permission !== "default") return;
    }

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
      if (ehAppIOSNoNavegador()) {
        /*
         * No aplicativo quem pede a permissão é o SISTEMA, não o navegador —
         * `registrarPushNativo` chama o plugin, espera o token do APNs chegar
         * por evento e o manda para /api/push/subscribe. Recusar é uma
         * resposta válida e devolve false, sem erro.
         */
        await registrarPushNativo();
      } else {
        const permissao = await Notification.requestPermission();
        if (permissao === "granted") {
          await inscreverPush();
        }
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
    // Bloco normal no fluxo da página (não mais `position:fixed`) — em
    // qualquer posição fixa (topo, embaixo) ele acaba competindo com outro
    // elemento fixo da própria página (bottom nav, FAB, o campo do chat da
    // Mimu) e bloqueando clique nele por cima. Aqui ele só empurra o
    // conteúdo da página pra baixo enquanto estiver visível, sem cobrir
    // nada.
    //
    // Vidro, como todo o resto: era o último cartão opaco da tela, e uma caixa
    // preta chapada no meio de superfícies translúcidas denuncia que aquele
    // pedaço não pertence ao app.
    <div className="vidro-card mt-4 flex items-start gap-3 rounded-[18px] p-4 md:max-w-[380px]">
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
