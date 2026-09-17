"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ExternalLink } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { formatDate, formatCurrency } from "@/lib/formatters";
import {
  nomeDoPlano,
  PLANOS,
  ehPlanoGratuito,
  MENSAGENS_MIMU_POR_DIA,
} from "@/lib/planos";
import {
  caminhoDeCompra,
  abrirGerenciamentoDaApple,
  PRODUTO_IAP,
  type ResultadoCompra,
} from "@/lib/iap";
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
/**
 * O que dizer para cada recusa do plugin nativo.
 *
 * Os códigos vêm de ios-plugin/MimuIAP/MimuIAP.swift. `cancelada` não está
 * aqui de propósito: quem desiste não vê aviso nenhum.
 */
const RECADO_DA_COMPRA: Record<string, string> = {
  produto_desconhecido:
    "A App Store ainda não está oferecendo este plano neste aparelho. Se a assinatura foi criada há pouco, pode levar algumas horas até ficar disponível.",
  produto_ausente:
    "Não consegui identificar o plano para comprar. Atualize o app e tente de novo.",
  ios_antigo:
    "A compra pelo app precisa de uma versão mais nova do iOS neste aparelho.",
  pendente:
    "A compra ficou aguardando aprovação. Assim que for liberada, o acesso entra sozinho.",
};

function recadoDaCompra(erro?: string): string {
  if (erro && RECADO_DA_COMPRA[erro]) return RECADO_DA_COMPRA[erro];
  // O código cru entra na mensagem de propósito: sem ele, "não deu certo" é
  // tudo o que sobra para quem for investigar, e foi o que custou caro aqui.
  return `Não consegui concluir a compra${erro ? ` (${erro})` : ""}. Tente de novo em instantes.`;
}

/**
 * Manda o recibo da Apple para o servidor, que é QUEM LIBERA O ACESSO.
 *
 * Isto não existia. `comprar()` e `restaurar()` devolvem o `transactionId`, e
 * a tela o descartava: chamava `router.refresh()` e pronto. O resultado, medido
 * em 17/09/2026 com uma compra real em sandbox, foi a Apple registrar a
 * assinatura e o nosso banco não ter linha nenhuma — nem em `pagamentos`, nem
 * em `assinaturas`. Em produção isso é cliente pagando e não recebendo nada.
 *
 * A rota /api/pagamento/apple já existia inteira, com credenciais
 * configuradas. Era código morto: nada no cliente a chamava.
 *
 * Devolve `null` quando deu certo, ou a frase a mostrar quando não deu. O erro
 * aqui é diferente de todos os outros desta tela: A COMPRA JÁ ACONTECEU e o
 * dinheiro já saiu. Dizer só "não deu certo" faria a pessoa tentar comprar de
 * novo — por isso toda mensagem daqui confirma a cobrança e aponta o
 * "Restaurar compras".
 */
async function confirmarNoServidor(
  transactionId?: string,
): Promise<string | null> {
  if (!transactionId) {
    return "A compra foi concluída na App Store, mas não consegui ler o recibo. Toque em Restaurar compras para liberar o acesso.";
  }

  let resposta: Response;
  try {
    resposta = await fetch("/api/pagamento/apple", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId }),
    });
  } catch {
    return "A compra foi concluída na App Store, mas não consegui falar com a Mimu para liberar o acesso. Confira sua internet e toque em Restaurar compras.";
  }

  if (resposta.ok) return null;

  const corpo = (await resposta.json().catch(() => ({}))) as { error?: string };
  return corpo.error
    ? `${corpo.error} A cobrança na App Store já foi feita — toque em Restaurar compras quando resolver.`
    : "A compra foi concluída na App Store, mas não consegui liberar o acesso agora. Toque em Restaurar compras em instantes.";
}

export function PlanoSection() {
  const { plano, assinatura } = useAuth();
  const router = useRouter();
  const [abrindo, setAbrindo] = useState(false);
  const [restaurando, setRestaurando] = useState(false);
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
    const resultado = await window
      .MimuIAP!.comprar({
        produtoId: PRODUTO_IAP.pro.mensal,
      })
      /*
       * O motivo da REJEIÇÃO entra no resultado, e não um "falhou" seco.
       *
       * Quando a ponte do Capacitor recusa a chamada — plugin sem
       * implementação nativa, método com nome diferente, erro na ponte —, ela
       * rejeita a promessa em vez de responder. O Swift nunca rejeita: todos
       * os desfechos dele chamam `resolve`. Então rejeição aqui significa que
       * a chamada NÃO CHEGOU ao nativo, e a mensagem da rejeição é a única
       * coisa que diz por quê.
       *
       * Sem isto o sintoma era "falhou", que não distingue ponte quebrada de
       * compra recusada — e foi o que travou a investigação em 11/09/2026.
       */
      .catch((e: unknown): ResultadoCompra => ({
        ok: false,
        erro: `ponte: ${e instanceof Error ? e.message : String(e)}`,
      }));
    setAbrindo(false);

    if (!resultado.ok) {
      /*
       * Só a DESISTÊNCIA é silêncio.
       *
       * Antes este `return` era incondicional, com a justificativa de não
       * assustar quem só mudou de ideia. Mas ele engolia junto o plugin
       * ausente, o produto que a App Store não encontra, a rede caída e a
       * recusa do servidor — e o sintoma de todos era o mesmo: tocar em
       * "Fazer upgrade" e NADA acontecer. Foi exatamente assim que o botão
       * apareceu quebrado no TestFlight em 11/09/2026, sem deixar rastro.
       *
       * A desistência tem código próprio (`cancelada`, de MimuIAP.swift).
       * Tudo o que não for ela é defeito e precisa aparecer — inclusive para
       * quem for depurar isto depois, que hoje não tem por onde começar.
       */
      if (resultado.erro === "cancelada") return;
      setAviso(recadoDaCompra(resultado.erro));
      return;
    }

    /*
     * O recibo vai para o servidor, e é ELE quem libera.
     *
     * O comentário antigo aqui já dizia a coisa certa — "quem libera o acesso
     * é o servidor, depois de conferir o recibo com a App Store" —, mas o
     * código só chamava `router.refresh()`. Recarregar uma tela cujo servidor
     * nunca soube da compra não muda nada: ela volta idêntica.
     */
    setAbrindo(true);
    const problema = await confirmarNoServidor(resultado.transactionId);
    setAbrindo(false);

    if (problema) {
      setAviso(problema);
      return;
    }

    router.refresh();
  }

  /*
   * Restaurar compras — a Apple EXIGE este caminho.
   *
   * A diretriz 3.1.1 é explícita: app com assinatura precisa oferecer como
   * recuperar o que já foi pago. Sem isso, quem trocou de aparelho ou
   * reinstalou perde o acesso, e a revisão reprova o envio.
   *
   * Note que o acesso NÃO é liberado pelo que volta daqui, exatamente como na
   * compra: `restaurar()` só faz a Apple reconhecer a assinatura no aparelho.
   * Quem libera é o servidor, conferindo o recibo — por isso o `refresh()` no
   * fim, em vez de mexer no estado da tela.
   */
  async function restaurarCompras() {
    setAviso(null);

    if (!window.MimuIAP) {
      setAviso(
        "A restauração só funciona dentro do app da App Store. Se você assinou pelo site, sua conta já está ativa aqui.",
      );
      return;
    }

    setRestaurando(true);
    const resultado = await window.MimuIAP.restaurar().catch(
      (e: unknown): ResultadoCompra => ({
        ok: false,
        erro: `ponte: ${e instanceof Error ? e.message : String(e)}`,
      }),
    );
    setRestaurando(false);

    if (!resultado.ok) {
      /*
       * "Não achei nada" e "deu erro" merecem a mesma frase, e é de propósito.
       *
       * A Apple não distingue os dois de forma confiável, e para quem está
       * olhando a diferença não muda o que fazer. Prometer "você não tem
       * assinatura" com base num erro de rede seria pior: a pessoa acharia que
       * perdeu o que pagou.
       */
      setAviso(
        "Não encontrei nenhuma assinatura para restaurar nesta conta da App Store.",
      );
      return;
    }

    /*
     * Restaurar sem avisar o servidor não restaura nada.
     *
     * A Apple devolve o `transactionId` de quem já tem direito, e era ele que
     * faltava chegar aqui: a tela só chamava `router.refresh()`. Este é o
     * ÚNICO caminho de recuperação de quem trocou de aparelho, reinstalou, ou
     * comprou num momento em que o nosso servidor falhou — sem ele, "Restaurar
     * compras" era um botão que não restaurava.
     */
    setRestaurando(true);
    const problema = await confirmarNoServidor(resultado.transactionId);
    setRestaurando(false);

    if (problema) {
      setAviso(problema);
      return;
    }

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
              registrando vendas, vendo seu faturamento e falando com a Mimu
              (até {MENSAGENS_MIMU_POR_DIA.free} mensagens por dia), e não perde
              nada do que já cadastrou.
            </p>
          </div>
        )}

        {gratuito && (
          <div className="rounded-button bg-verde-light p-3.5">
            <p className="text-sm font-semibold text-verde-texto">
              Você está no plano grátis
            </p>
            {/*
              Este texto dizia que a Mimu entrava no plano pago, e isso deixou
              de ser verdade: a assistente agora responde em todo plano, com
              teto de mensagens por dia. Copy que promete a menos é tão ruim
              quanto copy que promete a mais — quem lê "a Mimu é paga" nunca
              vai descobrir que já pode conversar com ela.
            */}
            <p className="mt-1 text-xs leading-relaxed text-verde-texto">
              Dá para registrar vendas, acompanhar o faturamento e falar com a
              Mimu pra sempre, sem pagar nada — são{" "}
              {MENSAGENS_MIMU_POR_DIA.free} mensagens por dia. No Pro são{" "}
              {MENSAGENS_MIMU_POR_DIA.pro}, e entram agenda, clientes e estoque.
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

        {/*
          "Restaurar compras" só aparece DENTRO do app da Apple.

          No site ele não teria o que fazer — não existe StoreKit ali —, e um
          botão que só serve para explicar que não serve é ruído na tela de
          quem assinou pelo cartão.
        */}
        {onde !== "web" && (
          <button
            type="button"
            onClick={restaurarCompras}
            disabled={restaurando}
            className="text-[15px] font-bold text-primary-forte disabled:opacity-50"
          >
            {restaurando ? "Procurando..." : "Restaurar compras"}
          </button>
        )}

        {/*
          As condições da assinatura e os dois links, ANTES da compra.
          
          A diretriz 3.1.2 da Apple exige isto no app, e não só na página da
          loja: duração, renovação automática, como desligar, e links
          funcionais para os Termos de Uso e a Política de Privacidade. O
          envio de 11/09/2026 foi reprovado por faltar o link na descrição da
          loja; isto fecha o outro lado da mesma exigência.

          Fica visível nos dois lugares — app e site — porque a regra vale
          para quem compra pela Apple, e a informação não atrapalha quem
          compra pelo cartão.
        */}
        <p className="text-[13px] leading-relaxed text-neutro-muted">
          A assinatura se renova automaticamente pelo mesmo período, e a
          cobrança acontece na sua conta da Apple na confirmação da compra. Você
          pode desligar a renovação até 24 horas antes do fim do período em
          curso, em Ajustes &rsaquo; seu nome &rsaquo; Assinaturas — o período
          já pago não é interrompido.{" "}
          <a
            href="https://mimu.pro/legal/termos"
            className="font-semibold text-primary-forte underline underline-offset-2"
          >
            Termos de Uso
          </a>{" "}
          e{" "}
          <a
            href="https://mimu.pro/legal/privacidade"
            className="font-semibold text-primary-forte underline underline-offset-2"
          >
            Política de Privacidade
          </a>
          .
        </p>

        {pagaAtiva && (
          <button
            type="button"
            onClick={cancelar}
            className="flex items-center justify-center gap-1.5 rounded-button border border-neutro-border py-3 text-sm font-semibold text-neutro-muted transition-colors hover:bg-fundo"
          >
            {compradaNaApple && (
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} />
            )}
            {compradaNaApple ? "Gerenciar na App Store" : "Cancelar assinatura"}
          </button>
        )}
      </div>
    </SectionCard>
  );
}
