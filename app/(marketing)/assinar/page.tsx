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
import { PLANOS, PLANO_PADRAO, planoValido } from "@/lib/planos";
import { createClient } from "@/lib/supabase/server";
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
  searchParams: { plano?: string };
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

  if (pedido && assinatura && assinatura.status !== "ativa" && assinatura.plano !== pedido) {
    await supabase
      .from("assinaturas")
      .update({ plano: pedido, valor_mensal: PLANOS[pedido].valorMensal })
      .eq("id", assinatura.id);
    assinatura.plano = pedido;
  }

  const plano = planoValido(assinatura?.plano) ?? pedido ?? PLANO_PADRAO;
  const { nome: nomePlano, valorMensal } = PLANOS[plano];

  return conteudo(nomePlano, valorMensal, assinatura?.status === "pendente");
}

function conteudo(
  nomePlano: string,
  valorMensal: number,
  jaEscolheuPago: boolean,
) {
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

        <div className="mt-7 overflow-hidden rounded-card border border-neutro-border bg-superficie">
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
                R$ {valorMensal}
              </span>
              <span className="text-sm text-neutro-muted">/mês</span>
            </p>
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
