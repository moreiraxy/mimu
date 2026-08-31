"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { SectionCard } from "./SectionCard";

/**
 * Conectar o WhatsApp à conta.
 *
 * A pessoa toca uma vez e o WhatsApp abre com a mensagem já escrita, código e
 * tudo — ela só aperta enviar. Depois disso é só escrever para a Mimu, sempre,
 * sem passo nenhum.
 *
 * Esse toque único é o que substitui mandar um código para ela. E não é só
 * conveniência: a mensagem chegando daquele número é o WhatsApp provando que
 * ela controla aquele número, a mesma garantia de receber um código, na
 * direção contrária. Fazer o contrário — nós mandarmos a mensagem primeiro —
 * seria disparo frio para números que nunca falaram com a gente, que é o
 * padrão que faz o antispam da Meta banir o número.
 *
 * O código é gerado ao ABRIR a seção, e não ao clicar. Assim o botão é um link
 * de verdade, com href pronto: gerar no clique obrigaria a esperar a resposta
 * antes de abrir o WhatsApp, e navegador bloqueia janela aberta depois de
 * `await`.
 */

const NUMERO_MIMU = process.env.NEXT_PUBLIC_WHATSAPP_MIMU;

interface Estado {
  conectado: boolean;
  telefone: string | null;
}

export function WhatsAppSection() {
  const { showToast } = useToast();
  const [estado, setEstado] = useState<Estado | null>(null);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [desconectando, setDesconectando] = useState(false);
  // Separa "ainda carregando" de "deu errado" — ver o comentário no render.
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function carregar() {
      const resposta = await fetch("/api/whatsapp/vinculo").catch(() => null);
      if (cancelado) return;
      if (!resposta?.ok) {
        console.warn(
          "[mimu] Não consegui ler o estado do vínculo do WhatsApp:",
          resposta ? `HTTP ${resposta.status}` : "a requisição não completou",
        );
        setFalhou(true);
        return;
      }

      const atual = (await resposta.json()) as Estado;
      if (cancelado) return;
      setEstado(atual);

      // Só gera código para quem ainda não conectou: quem já está conectada
      // não precisa de um, e gerar à toa encheria a tabela a cada visita.
      if (!atual.conectado) {
        const nova = await fetch("/api/whatsapp/vinculo", {
          method: "POST",
        }).catch(() => null);
        if (nova?.ok && !cancelado) {
          const { codigo: gerado } = (await nova.json()) as { codigo: string };
          setCodigo(gerado);
        }
      }
    }

    carregar();
    return () => {
      cancelado = true;
    };
  }, []);

  async function desconectar() {
    setDesconectando(true);
    const resposta = await fetch("/api/whatsapp/vinculo", {
      method: "DELETE",
    }).catch(() => null);
    setDesconectando(false);

    if (!resposta?.ok) {
      showToast("Não consegui desconectar. Tenta de novo.");
      return;
    }

    showToast("WhatsApp desconectado.");
    setEstado({ conectado: false, telefone: null });
  }

  /*
   * Sem número configurado, a seção não existe.
   *
   * Mostrar um botão que não leva a lugar nenhum é pior do que não mostrar
   * nada: a pessoa toca, não acontece nada, e conclui que a Mimu está
   * quebrada.
   *
   * Continua sumindo em silêncio de propósito — mas AVISA no console, porque
   * este caso não é "a dona não tem direito", é "faltou configuração no
   * servidor". Sem o aviso, a diferença entre os dois é invisível para quem
   * for investigar, e a seção some sem deixar rastro.
   */
  if (!NUMERO_MIMU) {
    if (typeof console !== "undefined") {
      console.warn(
        "[mimu] Seção do WhatsApp escondida: NEXT_PUBLIC_WHATSAPP_MIMU não foi " +
          "gravada na compilação. Ela é lida na hora do build, não em execução — " +
          "definir a variável no painel exige um deploy novo para valer.",
      );
    }
    return null;
  }

  /*
   * Enquanto carrega, a seção EXISTE.
   *
   * Antes ela devolvia nada até a consulta responder, e nada é o que ela devolve
   * também quando a consulta FALHA. Os dois casos eram indistinguíveis — de
   * fora, "a seção não aparece", e ninguém tinha como saber se estava lenta,
   * quebrada, ou se aquela conta simplesmente não tinha a função.
   */
  if (!estado) {
    return (
      <SectionCard
        icone={MessageCircle}
        titulo="Mimu no WhatsApp"
        descricao="Fale com a Mimu de onde você já está"
      >
        <p className="text-sm text-neutro-muted">
          {falhou
            ? "Não consegui verificar se o seu WhatsApp está conectado. Recarregue a página — se continuar, me chame que eu olho."
            : "Verificando…"}
        </p>
      </SectionCard>
    );
  }

  const mensagemPronta = codigo
    ? `Oi Mimu! Meu código é ${codigo}`
    : null;
  const linkWhatsApp = mensagemPronta
    ? `https://wa.me/${NUMERO_MIMU.replace(/\D/g, "")}?text=${encodeURIComponent(mensagemPronta)}`
    : null;

  return (
    <SectionCard
      icone={MessageCircle}
      titulo="Mimu no WhatsApp"
      descricao="Fale com a Mimu de onde você já está"
    >
      {estado.conectado ? (
        <div className="flex flex-col gap-3.5">
          <div className="flex items-start gap-2.5 rounded-button bg-verde-light p-3.5">
            <Check
              className="mt-0.5 h-4 w-4 flex-shrink-0 text-verde-texto"
              strokeWidth={2.75}
            />
            <div>
              <p className="text-sm font-semibold text-verde-texto">
                Conectado {estado.telefone ? `— ${estado.telefone}` : ""}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-verde-texto">
                É só me mandar mensagem no WhatsApp que eu já sei que é você.
                Pergunte quanto vendeu, como está a agenda, o que está acabando.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={desconectar}
            disabled={desconectando}
            className="rounded-button border border-neutro-border py-3 text-sm font-semibold text-neutro-muted transition-colors hover:bg-fundo disabled:opacity-50"
          >
            {desconectando ? "Desconectando..." : "Desconectar este número"}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          <p className="text-sm leading-relaxed text-neutro-muted">
            Toque no botão abaixo. O WhatsApp abre com a mensagem já escrita —
            você só aperta enviar. Depois disso, é só me chamar por lá quando
            quiser.
          </p>

          {linkWhatsApp ? (
            <a
              href={linkWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-button bg-primary py-3.5 text-sm font-bold text-primary-text transition-colors hover:bg-primary-hover"
            >
              <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
              Conectar meu WhatsApp
            </a>
          ) : (
            <Button disabled>Preparando...</Button>
          )}
        </div>
      )}
    </SectionCard>
  );
}
