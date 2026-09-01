"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Wallet } from "lucide-react";
import { CartaoDado } from "@/components/CartaoDado";
import { nomeDoPlano } from "@/lib/planos";
import type { Cota } from "@/lib/mimu/cota";
import { cn } from "@/lib/utils";

/**
 * Os dois cartões do topo do perfil: o que a conta É e quanto ela ainda tem.
 *
 * Os dois vivem no mesmo componente porque a LARGURA de um depende da
 * existência do outro. A cota pode não carregar — sem rede, ou com a
 * assistente desligada nos módulos, quando o middleware barra a rota — e um
 * cartão de plano ocupando metade da linha, com a outra metade vazia, lê como
 * defeito. Aqui, quando a cota não vem, o plano ocupa a linha inteira e
 * ninguém percebe que faltou alguma coisa.
 */
export function CartoesDaConta({ plano }: { plano: string | null }) {
  /*
   * Três estados, e não dois — é a diferença entre a tela pular e não pular.
   *
   * "Ainda não sei" NÃO é "não existe". Tratando os dois como `null`, o cartão
   * do plano nascia ocupando a linha inteira e encolhia para a metade quando a
   * cota chegava, um segundo depois: a tela inteira dava um pulo embaixo do
   * dedo de quem já tinha começado a ler.
   *
   * Carregando, o lugar da cota fica reservado e vazio. Só quando a busca
   * FALHA é que o plano toma a linha toda — e aí não há pulo, porque nada
   * chega depois.
   */
  const [cota, setCota] = useState<Cota | "carregando" | "falhou">("carregando");

  useEffect(() => {
    let cancelado = false;

    fetch("/api/mimu/cota")
      .then((r) => (r.ok ? r.json() : null))
      .then((dados) => {
        if (cancelado) return;
        setCota(
          dados && typeof dados.limite === "number" ? (dados as Cota) : "falhou",
        );
      })
      .catch(() => {
        // Sem rede, ou a assistente desligada nos módulos (o middleware barra
        // a rota). Nos dois casos o certo é não mostrar o cartão.
        if (!cancelado) setCota("falhou");
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const falhou = cota === "falhou";
  const carregando = cota === "carregando";

  return (
    <div className="mt-4 grid grid-cols-2 gap-3">
      {/*
        Mesma anatomia dos cartões do painel: ícone no alto, rótulo miúdo e
        valor grande embaixo, com o cartão tendo altura própria. Eram dois
        retângulos rasos com duas linhas de texto encostadas no topo — a
        referência usa cartões com corpo, e é o corpo que faz o número parecer
        o assunto.
      */}
      <CartaoDado
        icone={Wallet}
        rotulo="Plano"
        texto={nomeDoPlano(plano)}
        href="/minha-empresa/assinatura"
        className={cn(falhou && "col-span-2")}
      />

      {!falhou && (
        <CartaoDado
          icone={MessageCircle}
          rotulo="Mensagens hoje"
          texto={carregando ? "—" : `${cota.restantes} / ${cota.limite}`}
          detalhe={carregando ? undefined : "Conversas com a Mimu"}
          grafico={
            carregando ? undefined : (
              <span className="flex h-10 w-10 items-center justify-center">
                <MessageCircle
                  className="h-[22px] w-[22px] text-neutro-muted"
                  strokeWidth={1.75}
                />
              </span>
            )
          }
        />
      )}
    </div>
  );
}
