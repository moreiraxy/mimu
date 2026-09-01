"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { TelaDeAjuste } from "@/components/perfil/TelaDeAjuste";
import { classesBotao } from "@/components/ui/Button";
import { MarcaTraco } from "@/components/Logo";
import { linkWhatsApp } from "@/lib/contato";
import { linkAvaliacaoAppStore, linkAvaliacaoPlayStore } from "@/lib/loja";
import { cn } from "@/lib/utils";

/**
 * Avaliar a Mimu.
 *
 * A pergunta vem ANTES da loja, e essa ordem é a decisão desta tela.
 *
 * Mandar todo mundo direto para a App Store transforma a nota da loja num
 * sorteio: quem está com um problema na mão vai escrever exatamente sobre o
 * problema, em público, onde não se pode responder nem resolver. E quem está
 * satisfeita muitas vezes não termina, porque a loja pede a senha da conta.
 *
 * Perguntando primeiro, cada uma vai para onde é útil: quem está feliz vai
 * para a loja (é lá que a nota conta), quem não está vai para o WhatsApp, com
 * a conversa aberta e alguém do outro lado.
 *
 * Isto não é filtrar avaliação ruim — ninguém é impedido de ir à loja. É não
 * empurrar a pessoa errada para o lugar errado.
 */
export default function AvaliarPage() {
  const [nota, setNota] = useState<number | null>(null);

  const loja = linkAvaliacaoAppStore() ?? linkAvaliacaoPlayStore();
  const gostou = nota !== null && nota >= 4;

  return (
    <TelaDeAjuste titulo="Avalie a Mimu">

      <div className="flex flex-col items-center gap-5 vidro-card rounded-card px-5 py-8 text-center">
        <MarcaTraco size={56} className="text-primary-forte" />

        <div>
          <h2 className="text-lg font-semibold text-escuro">
            Como está sendo usar a Mimu?
          </h2>
          <p className="mt-1 text-[13px] text-neutro-muted">
            Sua resposta ajuda a decidir o que a gente faz em seguida.
          </p>
        </div>

        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((valor) => (
            <button
              key={valor}
              type="button"
              onClick={() => setNota(valor)}
              aria-label={`${valor} ${valor === 1 ? "estrela" : "estrelas"}`}
              aria-pressed={nota === valor}
              className="p-1.5 transition-transform active:scale-90"
            >
              <Star
                className={cn(
                  "h-8 w-8 transition-colors",
                  nota !== null && valor <= nota
                    ? "fill-primary text-primary"
                    : "text-neutro-border",
                )}
                strokeWidth={1.75}
              />
            </button>
          ))}
        </div>

        {nota !== null &&
          (gostou ? (
            <div className="flex w-full flex-col gap-2">
              <p className="text-[13px] text-neutro-muted">
                Que bom! Deixar isso escrito ajuda outras donas de negócio a
                encontrar a Mimu.
              </p>
              {loja ? (
                <a
                  href={loja}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classesBotao()}
                >
                  Avaliar na loja
                </a>
              ) : (
                /*
                 * Sem loja ainda, o caminho honesto é o WhatsApp. Um botão
                 * "Avaliar na loja" desativado só faria a pessoa achar que o
                 * app está quebrado.
                 */
                <a
                  href={linkWhatsApp("Oi! Queria deixar um elogio sobre a Mimu:")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classesBotao()}
                >
                  Mandar um recado
                </a>
              )}
            </div>
          ) : (
            <div className="flex w-full flex-col gap-2">
              <p className="text-[13px] text-neutro-muted">
                Desculpa. Conta o que está atrapalhando que a gente resolve.
              </p>
              <a
                href={linkWhatsApp(
                  "Oi! Tenho uma sugestão / reclamação sobre a Mimu:",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={classesBotao()}
              >
                Falar com a gente
              </a>
            </div>
          ))}
      </div>
    </TelaDeAjuste>
  );
}
