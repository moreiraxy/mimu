import Link from "next/link";
import {
  Calendar,
  Check,
  CreditCard,
  MessageCircle,
  Package,
  QrCode,
  Sparkles,
  TrendingUp,
  Wallet,
  WifiOff,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import {
  PLANOS,
  PLANO_PADRAO,
  planoValido,
  periodicidadeValida,
  valorDoPlano,
  type PlanoPago,
  type Periodicidade,
} from "@/lib/planos";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { buscarEmpresaEAssinatura } from "@/lib/assinatura";

const ITENS_INCLUIDOS = [
  { icone: Calendar, label: "Agenda e Clientes ilimitados" },
  { icone: Wallet, label: "Controle financeiro completo" },
  { icone: TrendingUp, label: "Faturamento previsto" },
  { icone: Sparkles, label: "Assistente Mimu com IA" },
  { icone: Package, label: "Produtos e Estoque" },
  { icone: WifiOff, label: "Funciona offline" },
  { icone: MessageCircle, label: "Suporte via chat" },
] as const;

/**
 * Mostra o plano que a pessoa escolheu na landing, e não um preço fixo.
 *
 * O plano é lido da assinatura no banco (gravada no fim do onboarding), nunca
 * da URL: quem chega aqui já decidiu, e deixar o preço vir do endereço
 * permitiria assinar o Premium pagando o valor do Pro.
 */
export default async function AssinarPage({
  searchParams,
}: {
  searchParams: { plano?: string; periodicidade?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { assinatura } = user
    ? await buscarEmpresaEAssinatura(supabase, user.id)
    : { assinatura: null };

  // Plano pedido agora (veio da landing, direto ou passando pelo login).
  // Só é aplicado se a assinatura ainda NÃO estiver ativa: mexer no plano de
  // quem já paga seria uma troca de plano de verdade, com cobrança
  // proporcional, e isso ainda não existe. Mesmo aplicando, o preço continua
  // vindo da tabela do servidor — a URL escolhe o plano, nunca o valor.
  const pedido = planoValido(searchParams.plano);

  /*
   * A periodicidade segue a mesma regra do plano: a URL escolhe QUAL, e o
   * valor sai da tabela do servidor. Mandar o valor pela URL deixaria qualquer
   * pessoa assinar o ano por um centavo.
   *
   * `valorDoPlano` devolve null quando a combinação não é vendida — um plano
   * sem preço anual cai de volta no mensal em vez de cobrar errado.
   */
  const periodicidadePedida = periodicidadeValida(searchParams.periodicidade);
  const periodicidade: Periodicidade =
    periodicidadePedida && valorDoPlano(pedido ?? PLANO_PADRAO, periodicidadePedida) !== null
      ? periodicidadePedida
      : "mensal";

  const precisaAtualizar =
    assinatura &&
    assinatura.status !== "ativa" &&
    (assinatura.plano !== pedido || assinatura.periodicidade !== periodicidade);

  if (pedido && precisaAtualizar) {
    /*
     * Grava com a service role, não com a sessão.
     *
     * A auditoria de segurança revogou escrita em `assinaturas` para quem está
     * logado, porque dava para virar Premium de graça por um update no
     * console. Esta gravação aqui é legítima, mas passava pela sessão: depois
     * da revogação ela falhava calada e a troca de plano não acontecia.
     *
     * O alcance não muda, a linha é a mesma que já veio resolvida pela sessão.
     * O preço continua saindo da tabela do servidor: a URL escolhe o plano,
     * nunca o valor.
     */
    const { error } = await createServiceClient()
      .from("assinaturas")
      .update({
        plano: pedido,
        periodicidade,
        valor_mensal: PLANOS[pedido].valorMensal,
      })
      .eq("id", assinatura!.id);

    if (error) {
      console.error("Não consegui trocar o plano da assinatura.", error);
    } else {
      assinatura!.plano = pedido;
      assinatura!.periodicidade = periodicidade;
    }
  }

  const plano = planoValido(assinatura?.plano) ?? pedido ?? PLANO_PADRAO;
  const { nome: nomePlano, valorMensal } = PLANOS[plano];

  return conteudo(
    plano,
    nomePlano,
    valorMensal,
    periodicidade,
    assinatura?.status === "pendente",
    // Trocar de plano só faz sentido enquanto ninguém está pagando. Para quem
    // já paga, seria troca de verdade, com cobrança proporcional, e isso ainda
    // não existe.
    assinatura?.status !== "ativa",
  );
}

/**
 * Deixa escolher entre os planos, ali mesmo.
 *
 * A tela mostrava UM plano, o que estivesse gravado na assinatura, sem nenhuma
 * forma de mudar. Quem clicou em Premium na landing meses atrás e deixou o
 * teste vencer voltava e dava de cara com R$ 199, sem saber que existia um de
 * R$ 39. Parecia preço da Mimu, não uma escolha dela.
 *
 * Cada opção é um link para a própria página com ?plano=, que o código acima já
 * sabia tratar: ele grava a escolha e o preço continua vindo da tabela do
 * servidor. A URL escolhe o plano, nunca o valor.
 */
/**
 * Mensal ou anual.
 *
 * Dois links, e não um formulário: a escolha vira parâmetro na URL, o servidor
 * grava na assinatura e o preço sai da tabela dele. É a mesma regra do seletor
 * de planos — a URL escolhe QUAL, nunca QUANTO. Mandar valor pelo navegador
 * deixaria qualquer pessoa assinar o ano por um centavo.
 */
function seletorDePeriodicidade(
  plano: PlanoPago,
  atual: Periodicidade,
) {
  const { valorMensal, valorAnual } = PLANOS[plano];
  const desconto =
    valorAnual !== null
      ? Math.round((1 - valorAnual / (valorMensal * 12)) * 100)
      : 0;

  const opcoes: { chave: Periodicidade; label: string; nota: string | null }[] = [
    { chave: "mensal", label: "Mensal", nota: null },
    {
      chave: "anual",
      label: "Anual",
      // O desconto é calculado, não escrito: mexer no preço da tabela não pode
      // deixar a tela prometendo uma economia que não existe mais.
      nota: desconto > 0 ? `-${desconto}%` : null,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5">
      {opcoes.map(({ chave, label, nota }) => {
        const ativo = chave === atual;
        return (
          <Link
            key={chave}
            href={`/assinar?plano=${plano}&periodicidade=${chave}`}
            aria-current={ativo ? "true" : undefined}
            className={[
              "flex items-center justify-center gap-2 rounded-card border px-3 py-3 text-center text-sm font-semibold transition-colors",
              ativo
                ? "border-primary bg-primary-light text-primary-forte"
                : "border-neutro-border text-neutro-muted hover:border-primary",
            ].join(" ")}
          >
            {label}
            {nota && (
              <span className="rounded-full bg-verde-light px-2 py-0.5 font-mono text-[10px] font-bold text-verde-texto">
                {nota}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function seletorDePlanos(planoAtual: PlanoPago, periodicidade: Periodicidade) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-2.5">
      {(Object.keys(PLANOS) as PlanoPago[]).map((chave) => {
        const { nome, valorMensal } = PLANOS[chave];
        const ativo = chave === planoAtual;
        return (
          <Link
            key={chave}
            href={`/assinar?plano=${chave}&periodicidade=${periodicidade}`}
            aria-current={ativo ? "true" : undefined}
            className={[
              "flex flex-col items-center rounded-card border px-3 py-3.5 text-center transition-colors",
              ativo
                ? "border-primary bg-primary-light"
                : "border-neutro-border bg-superficie hover:border-primary/40",
            ].join(" ")}
          >
            <span className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-neutro-muted">
              {nome}
            </span>
            <span className="mt-1 font-display text-xl font-bold leading-none text-escuro">
              R$ {valorMensal}
            </span>
            <span className="mt-0.5 text-[11px] text-neutro-muted">por mês</span>
          </Link>
        );
      })}
    </div>
  );
}

function conteudo(
  plano: PlanoPago,
  nomePlano: string,
  valorMensal: number,
  periodicidade: Periodicidade,
  jaEscolheuPago: boolean,
  podeTrocar: boolean,
) {
  const valorAnual = PLANOS[plano].valorAnual;
  const noAnual = periodicidade === "anual" && valorAnual !== null;

  /*
   * No anual, o preço grande continua sendo o POR MÊS.
   *
   * Mostrar "R$ 399/ano" ao lado de "R$ 39/mês" faz o anual parecer dez vezes
   * mais caro num relance. O que a pessoa compara é o mês; o total do ano vem
   * embaixo, junto com quanto ela economiza — que é a razão de existir a opção.
   */
  const porMes = noAnual ? Math.round(valorAnual! / 12) : valorMensal;
  const economia = noAnual ? valorMensal * 12 - valorAnual! : 0;
  return (
    // `dark` pelo mesmo motivo do cadastro e do onboarding: esta tela é a
    // continuação de uma landing preta, e quem chega aqui está no meio de uma
    // decisão de compra. Trocar para um fundo claro no meio do caminho fazia
    // parecer outro produto. Antes o fundo era verde-limão claro e o botão do
    // Pix era de um verde que não existe na marca.
    <div className="dark flex min-h-screen flex-col items-center bg-fundo px-5 py-10">
      <Logo size="md" />

      <div className="mt-9 w-full max-w-[400px]">
        <h1 className="text-center font-display text-[26px] font-bold leading-tight text-escuro">
          {jaEscolheuPago ? "Falta só o pagamento" : "Escolha como pagar"}
        </h1>
        <p className="mt-2 text-center text-sm text-neutro-muted">
          {jaEscolheuPago
            ? "Sua conta já está pronta. Assim que o pagamento cair, o app libera."
            : "Cancele quando quiser, sem multa e sem fidelidade."}
        </p>

        {podeTrocar && valorAnual !== null && (
          <div className="mt-7">{seletorDePeriodicidade(plano, periodicidade)}</div>
        )}

        <div className="mt-4">{podeTrocar && seletorDePlanos(plano, periodicidade)}</div>

        <div className="overflow-hidden rounded-card border border-neutro-border bg-superficie">
          <div className="flex flex-col items-center border-b border-neutro-border px-6 py-7 text-center">
            {!jaEscolheuPago && (
              <span className="rounded-full bg-primary-light px-3 py-1 font-mono text-[11px] font-bold uppercase tracking-wide text-primary-forte">
                7 dias grátis para começar
              </span>
            )}

            <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-neutro-muted">
              Plano {nomePlano}
            </p>
            <p className="mt-1.5 flex items-baseline gap-1.5">
              <span className="font-display text-[44px] font-bold leading-none text-escuro">
                R$ {porMes}
              </span>
              <span className="text-sm text-neutro-muted">/mês</span>
            </p>

            {noAnual && (
              <p className="mt-2 text-[13px] text-neutro-muted">
                R$ {valorAnual} cobrados uma vez por ano
                {economia > 0 && (
                  <>
                    {" — "}
                    <span className="font-semibold text-verde-texto">
                      você economiza R$ {economia}
                    </span>
                  </>
                )}
              </p>
            )}
          </div>

          <ul className="flex flex-col gap-3.5 px-6 py-6">
            {ITENS_INCLUIDOS.map((item) => (
              <li key={item.label} className="flex items-center gap-3">
                {/* Só o ícone e o texto. Antes cada linha trazia ícone, texto
                    E um check no fim, três elementos dizendo a mesma coisa
                    numa lista onde tudo está incluído. */}
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-primary-forte">
                  <item.icone className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <span className="text-[15px] text-escuro">{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {/* Pix na frente e em destaque: é como a maior parte do público da
              Mimu paga, e cai na hora. */}
          <Link
            href="/assinar/pix"
            className="flex h-[52px] items-center justify-center gap-2 rounded-button bg-primary text-[15px] font-bold text-primary-text transition-colors hover:bg-primary-hover"
          >
            <QrCode className="h-[18px] w-[18px]" strokeWidth={2.25} />
            Pagar com Pix
          </Link>
          <Link
            href="/assinar/cartao"
            className="flex h-[52px] items-center justify-center gap-2 rounded-button border border-neutro-border text-[15px] font-bold text-escuro transition-colors hover:border-primary-forte hover:text-primary-forte"
          >
            <CreditCard className="h-[18px] w-[18px]" strokeWidth={2.25} />
            Pagar com Cartão
          </Link>
        </div>

        <p className="mt-5 text-center text-xs text-neutro-muted">
          Pagamento processado pelo Mercado Pago. A Mimu não guarda os dados do
          seu cartão.
        </p>
      </div>
    </div>
  );
}
