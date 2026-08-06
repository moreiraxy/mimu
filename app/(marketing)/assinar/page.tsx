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
import { VALOR_MENSAL_MIMU } from "@/lib/planos";

const ITENS_INCLUIDOS = [
  { icone: Calendar, label: "Agenda e Clientes ilimitados" },
  { icone: Wallet, label: "Controle financeiro completo" },
  { icone: TrendingUp, label: "Faturamento previsto" },
  { icone: Sparkles, label: "Assistente Mimu com IA" },
  { icone: Package, label: "Produtos e Estoque" },
  { icone: WifiOff, label: "Funciona offline" },
  { icone: MessageCircle, label: "Suporte via chat" },
] as const;

export default function AssinarPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[#FFF5F4] px-6 py-10">
      <Logo size="md" />

      <h1 className="mt-8 text-center text-2xl font-semibold text-escuro">
        Escolha seu plano
      </h1>

      <div className="mt-8 w-full max-w-sm rounded-card border border-neutro-border bg-superficie p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <span className="rounded-full bg-verde-light px-3 py-1 text-xs font-semibold text-verde-dark">
            14 dias grátis para novos usuários
          </span>

          <p className="mt-4 text-lg font-semibold text-escuro">
            Mimu Completo
          </p>
          <p className="mt-1 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-coral">
              R$ {VALOR_MENSAL_MIMU}
            </span>
            <span className="text-sm text-neutro-muted">/mês</span>
          </p>
        </div>

        <ul className="mt-6 flex flex-col gap-3">
          {ITENS_INCLUIDOS.map((item) => (
            <li key={item.label} className="flex items-center gap-3">
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-coral-light text-coral">
                <item.icone className="h-3.5 w-3.5" strokeWidth={2.25} />
              </span>
              <span className="text-sm text-escuro">{item.label}</span>
              <Check
                className="ml-auto h-4 w-4 flex-shrink-0 text-verde"
                strokeWidth={2.5}
              />
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-col gap-3">
          <Link
            href="/assinar/pix"
            className="flex items-center justify-center gap-2 rounded-button bg-verde py-3.5 text-sm font-bold text-white transition-colors hover:bg-verde-dark"
          >
            <QrCode className="h-4 w-4" strokeWidth={2.25} />
            Pagar com Pix
          </Link>
          <Link
            href="/assinar/cartao"
            className="flex items-center justify-center gap-2 rounded-button bg-coral py-3.5 text-sm font-bold text-white transition-colors hover:bg-coral-hover"
          >
            <CreditCard className="h-4 w-4" strokeWidth={2.25} />
            Pagar com Cartão
          </Link>
        </div>
      </div>
    </div>
  );
}
