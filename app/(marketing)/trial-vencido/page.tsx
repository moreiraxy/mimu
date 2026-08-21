import Link from "next/link";
import { ArrowLeft, Clock, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PLANOS } from "@/lib/planos";
import { linkWhatsApp } from "@/lib/contato";

/**
 * Fim do período gratuito.
 *
 * A tela tinha uma saída só: assinar. Quem não quisesse assinar naquele
 * instante ficava presa, porque o site inteiro redireciona para cá e o link de
 * suporte era um e-mail num domínio que não é nosso.
 *
 * Agora são três caminhos: assinar, falar com gente, ou voltar ao site. Tela de
 * cobrança sem saída não converte mais, só irrita.
 */
export default function TrialVencidoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary-light px-6 py-10 text-center">
      <Logo size="md" />

      <span className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-ambar-light text-ambar-texto">
        <Clock className="h-7 w-7" strokeWidth={1.75} />
      </span>

      <h1 className="mt-6 text-2xl font-semibold text-escuro">
        Seu período gratuito acabou.
      </h1>
      <p className="mt-2 max-w-sm text-sm text-neutro-muted">
        Seus dados continuam aqui, guardados. É só escolher um plano para voltar
        a usar. A partir de R$ {PLANOS.pro.valorMensal} por mês.
      </p>

      <Link
        href="/assinar"
        className="mt-8 w-full max-w-xs rounded-button bg-primary py-3.5 text-center text-sm font-bold text-primary-text transition-colors hover:bg-primary-hover"
      >
        Escolher meu plano
      </Link>

      <a
        href={linkWhatsApp(
          "Oi! Meu período gratuito na Mimu acabou e eu queria falar com alguém antes de decidir.",
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-primary-forte"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
        Falar com a gente no WhatsApp
      </a>

      {/* A saída para quem não quer decidir agora. Sem isto, o site inteiro
          devolve para esta tela e a pessoa fica em círculo. */}
      <Link
        href="/?sair=1"
        className="mt-8 flex items-center gap-1.5 text-xs text-neutro-muted transition-colors hover:text-escuro"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
        Voltar ao site da Mimu
      </Link>
    </div>
  );
}
