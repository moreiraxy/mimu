"use client";

import { useLayoutEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import type { AssinaturaResumo, Empresa } from "@/types";
import type { User } from "@supabase/supabase-js";

/**
 * Entrega ao navegador o que o servidor já tinha.
 *
 * O layout do painel roda no servidor e já conhece a sessão, a empresa, o
 * plano e a assinatura — ele precisa disso para decidir os redirecionamentos.
 * Sem esta ponte esse conhecimento morria ali, e o `AuthProvider` ia buscar
 * tudo de novo depois de hidratar. Como `useDashboard` espera a empresa para
 * disparar, cada tela do painel esperava duas idas à rede em sequência onde
 * cabia uma.
 *
 * `useLayoutEffect` E NÃO `useEffect`, e a ordem é o ponto: efeitos de filho
 * rodam antes dos de pai, e os de layout antes dos comuns. Assim a semeadura
 * acontece com folga antes do efeito do AuthProvider — que então encontra o
 * `donoCarregado` marcado e não busca nada.
 *
 * Não renderiza nada. Existe só para atravessar a fronteira servidor/cliente,
 * que props sozinhas não atravessam quando o provedor está acima no layout
 * raiz.
 */
export function SementeDaSessao({
  user,
  empresa,
  plano,
  assinatura,
}: {
  user: User;
  empresa: Empresa;
  plano: string | null;
  assinatura: AssinaturaResumo | null;
}) {
  const { semear } = useAuth();

  useLayoutEffect(() => {
    semear({ user, empresa, plano, assinatura });
  }, [semear, user, empresa, plano, assinatura]);

  return null;
}
