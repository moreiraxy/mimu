"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";
import { CartaoDado } from "@/components/CartaoDado";
import type { Cota } from "@/lib/mimu/cota";

/**
 * Quantas conversas com a Mimu ainda sobram hoje, como widget do painel.
 *
 * O mesmo número que vive no perfil, agora onde ele é útil de manhã: é a
 * pergunta "posso pedir para ela registrar isso ou tenho que digitar?".
 *
 * Some quando não consegue ler — sem rede, ou com a assistente desligada nos
 * módulos. Um widget com traço no lugar do número ocupa o mesmo espaço para
 * dizer que não sabe.
 */
export function CartaoMensagensMimu() {
  const [cota, setCota] = useState<Cota | null>(null);

  useEffect(() => {
    let cancelado = false;
    fetch("/api/mimu/cota")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelado && d && typeof d.limite === "number") setCota(d as Cota);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, []);

  if (!cota) return null;

  return (
    <CartaoDado
      icone={MessageCircle}
      rotulo="Mensagens hoje"
      texto={`${cota.restantes} / ${cota.limite}`}
      detalhe="Conversas com a Mimu"
      href="/mimu"
    />
  );
}
