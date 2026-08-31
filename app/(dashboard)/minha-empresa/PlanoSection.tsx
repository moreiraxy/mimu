"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { nomeDoPlano, PLANOS, ehPlanoGratuito } from "@/lib/planos";
import { caminhoDeCompra, abrirGerenciamentoDaApple, PRODUTO_IAP } from "@/lib/iap";
import { linkWhatsApp } from "@/lib/contato";
import { SectionCard } from "./SectionCard";

/**
 * A tela onde a pessoa vê o plano e decide o que fazer com ele.
 *
 * As três escolhas — continuar no gratuito, fazer upgrade, manter a
 * assinatura — precisam existir nos DOIS lugares, web e iOS. O que muda é o
 * caminho: na web o upgrade vai para o checkout do Mercado Pago; no app iOS
 * vai para o In-App Purchase, porque a diretriz 3.1.1 exige que assinatura
 * digital consumida no app passe pela Apple.
 *
 * Nada aqui decide acesso. Quem decide é o servidor — o middleware e o teto
 * de lib/planos.ts. Esta tela conta o que já é verdade e oferece os caminhos.
 */
export function PlanoSection() {
  const { plano, assinatura } = useAuth();
  const router = useRouter();
  const [abrindo, setAbrindo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  if (!assinatura) return null;

  const gratuito = ehPlanoGratuito(plano);
  const emTeste = assinatura.status === "trial";
  const pagaAtiva = assinatura.status === "ativa" && !gratuito;
  const compradaNaApple = assinatura.origem === "apple";
  const onde = caminhoDeCompra();

  /*
   * Quantos dias faltam, calculado aqui e não em lib/assinatura.ts.
   *
   * Aquele arquivo importa o SDK do Mercado Pago, que é server-only: puxá-lo
   * para um componente de cliente quebraria o build. São três linhas de data,
   * e duplicá-las custa menos do que reorganizar o módulo de assinatura por
   * causa de um contador.
   */
  const fim = emTeste ? assinatura.trial_fim : assinatura.proxima_cobranca;
  const diasRestantes = fim
    ? Math.ceil((new Date(fim).getTime() - Date.now()) / 86_400_000)
    : null;

  async function fazerUpgrade() {
    setAviso(null);

    if (onde === "web") {
      router.push("/assinar");
      return;
    }

    if (onde === "indisponivel") {
      // Só acontece dentro do app iOS antes do plugin nativo existir. A tela
      // não deveria nem ter mostrado o botão — isto é a segunda barreira.
      setAviso("Assinatura pelo app ainda não está disponível nesta versão.");
      return;
    }

    setAbrindo(true);
    const resultado = await window.MimuIAP!.comprar(
      PRODUTO_IAP.pro.mensal,
    ).catch(() => ({ ok: false, erro: "falhou" }));
    setAbrindo(false);

    if (!resultado.ok) {
      // Desistir da compra é normal e não é erro: a Apple devolve o mesmo
      // "não ok" para quem fechou a folha de pagamento e para quem teve o
      // cartão recusado. Tratar como falha assustaria quem só mudou de ideia.
      return;
    }

    /*
     * Recarrega em vez de liberar aqui.
     *
     * Quem libera o acesso é o servidor, depois de conferir o recibo com a
     * App Store. Acreditar no "ok" que voltou do navegador seria liberar
     * Premium para qualquer pessoa capaz de abrir o console.
     */
    router.refresh();
  }

  async function cancelar() {
    setAviso(null);

    if (compradaNaApple) {
      const abriu = await abrirGerenciamentoDaApple();
      if (!abriu) {
        // Sem a ponte nativa não há como abrir os Ajustes daqui. Dizer onde
        // fica é melhor do que um botão que não faz nada.
        setAviso(
          "Sua assinatura foi feita pela App Store. Para cancelar, abra os Ajustes do iPhone, toque no seu nome e vá em Assinaturas.",
        );
      }
      return;
    }

    /*
     * Cancelamento pela web ainda passa por gente.
     *
     * É interino e está anotado como dívida: cancelar deveria ser tão fácil
     * quanto assinar, e hoje assinar é um clique. O caminho definitivo é
     * desligar o PreApproval do Mercado Pago daqui, e ele só existe depois da
     * cobrança recorrente — que ainda não foi construída.
     *
     * Enquanto isso, um link direto com a mensagem já escrita, e não um "fale
     * com o suporte" que obriga a pessoa a procurar o número.
     */
    window.open(
      linkWhatsApp("Oi! Quero cancelar minha assinatura da Mimu."),
      "_blank",
      "noopener,noreferrer",
    );
  }

  return (
    <SectionCard icone={Sparkles} titulo="Seu plano">
      <div className="flex flex-col gap-4">
        <div className="rounded-button border border-neutro-border p-3.5">
          <p className="text-xs text-neutro-muted">
            {emTeste ? "Teste grátis" : "Plano atual"}
          </p>
          <p className="text-lg font-bold text-escuro">
            {emTeste ? "Mimu completa" : nomeDoPlano(plano)}
          </p>

          {emTeste && diasRestantes !== null && (
            <p className="mt-1 text-sm text-neutro-muted">
              {diasRestantes > 1
                ? `Faltam ${diasRestantes} dias`
                : "Último dia"}
            </p>
          )}

          {pagaAtiva && assinatura.proxima_cobranca && (
            <p className="mt-1 text-sm text-neutro-muted">
              Renova sozinho em {formatDate(assinatura.proxima_cobranca)}
            </p>
          )}
        </div>

        {/*
          O que acontece se a pessoa não fizer nada.

          É a metade silenciosa da decisão, e a que mais assusta quando não é
          dita: quem está em teste imagina que vai perder tudo no dia 8. Dizer
          o contrário, com a data na frente, é o que faz "continuar no plano
          grátis" ser uma escolha de verdade e não uma ameaça.
        */}
        {emTeste && assinatura.trial_fim && (
          <div className="rounded-button bg-verde-light p-3.5">
            <p className="text-sm font-semibold text-verde-texto">
              Continuar no plano grátis
            </p>
            <p className="mt-1 text-xs leading-relaxed text-verde-texto">
              Se você não fizer nada, em {formatDate(assinatura.trial_fim)} sua
              conta passa sozinha para o plano gratuito. Você continua
              registrando vendas e vendo seu faturamento, e não perde nada do
              que já cadastrou.
            </p>
          </div>
        )}

        {gratuito && (
          <div className="rounded-button bg-verde-light p-3.5">
            <p className="text-sm font-semibold text-verde-texto">
              Você está no plano grátis
            </p>
            <p className="mt-1 text-xs leading-relaxed text-verde-texto">
              Dá para registrar vendas e acompanhar o faturamento pra sempre,
              sem pagar nada. Agenda, clientes, estoque e a Mimu entram no
              plano pago.
            </p>
          </div>
        )}

        {aviso && (
          <p className="rounded-button border border-neutro-border p-3.5 text-xs leading-relaxed text-escuro">
            {aviso}
          </p>
        )}

        {/*
          O botão de assinar só existe quando há para onde ir.

          Em "indisponivel" (app iOS sem o plugin nativo) ele simplesmente não
          é desenhado. Num app de assinatura, um botão de assinar que não faz
          nada não parece um recurso faltando: parece o produto quebrado.
        */}
        {!pagaAtiva && onde !== "indisponivel" && (
          <Button onClick={fazerUpgrade} disabled={abrindo}>
            {abrindo
              ? "Abrindo..."
              : onde === "web"
                ? `Fazer upgrade — ${formatCurrency(PLANOS.pro.valorMensal)}/mês`
                : /*
                     No iOS o preço NÃO sai da nossa tabela.
        
                     Quem define é o App Store Connect, por faixas de preço, e a
                     faixa mais próxima de R$ 39 pode não ser R$ 39. Escrever o
                     nosso valor aqui seria anunciar um preço e a Apple cobrar
                     outro. Quem sabe o valor certo é o StoreKit, por
                     `precoFormatado()` — até a folha de pagamento abrir, o
                     botão não promete número nenhum.
                  */
                  "Fazer upgrade"}
          </Button>
        )}

        {pagaAtiva && (
          <button
            type="button"
            onClick={cancelar}
            className="flex items-center justify-center gap-1.5 rounded-button border border-neutro-border py-3 text-sm font-semibold text-neutro-muted transition-colors hover:bg-fundo"
          >
            {compradaNaApple && <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />}
            {compradaNaApple ? "Gerenciar na App Store" : "Cancelar assinatura"}
          </button>
        )}
      </div>
    </SectionCard>
  );
}
