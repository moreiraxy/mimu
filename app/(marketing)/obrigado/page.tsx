import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Mail, LogIn, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { linkWhatsApp } from "@/lib/contato";

export const metadata: Metadata = {
  title: "Pagamento confirmado",
  // Não faz sentido no buscador: só existe como destino de quem acabou de
  // pagar, e indexar isso poria a página no Google sem contexto nenhum.
  robots: { index: false, follow: false },
};

/**
 * Onde a Cakto larga quem acabou de pagar.
 *
 * Quem compra por um link compartilhado nunca passou pelo mimu.app: não tem
 * conta, não tem senha, e nesse instante a conta dela está sendo criada pelo
 * webhook em outro processo. Sem esta tela a pessoa cai na página padrão da
 * Cakto dizendo "compra aprovada" e fica sem saber como entrar no que comprou.
 *
 * A página não depende de NENHUM parâmetro na URL de propósito. Não sabemos
 * ainda o que a Cakto anexa no redirect, e uma tela de pós-pagamento que
 * quebra quando falta um parâmetro é a pior hora possível para quebrar. Ela
 * também não consulta o banco: o webhook pode não ter chegado ainda, e dizer
 * "não achei sua compra" para quem acabou de pagar seria pior que não dizer
 * nada.
 *
 * Por isso os dois caminhos aparecem lado a lado, em vez de a tela tentar
 * adivinhar qual é o caso: conta nova (a maioria) recebe o e-mail de senha,
 * quem já usava a Mimu simplesmente entra.
 */
export default function ObrigadoPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary-light px-6 py-10 text-center">
      <Logo size="md" />

      <span className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-verde-light text-verde-dark">
        <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
      </span>

      <h1 className="mt-6 text-2xl font-semibold text-escuro">
        Pagamento confirmado.
      </h1>
      <p className="mt-2 max-w-sm text-sm text-neutro-muted">
        Sua conta está sendo liberada agora. Veja abaixo como entrar.
      </p>

      <div className="mt-8 flex w-full max-w-sm flex-col gap-3 text-left">
        <div className="rounded-card border border-neutro-border bg-superficie p-5">
          <span className="flex items-center gap-2 text-sm font-bold text-escuro">
            <Mail className="h-4 w-4 shrink-0" strokeWidth={2} />
            É sua primeira vez na Mimu
          </span>
          <p className="mt-2 text-sm leading-relaxed text-neutro-muted">
            Enviamos um e-mail para você criar sua senha, no mesmo endereço que
            usou na compra. Ele costuma chegar em poucos minutos. Se não
            aparecer, confira o spam ou a lixeira.
          </p>
          <Link
            href="/recuperar-senha"
            className="mt-3 inline-block text-sm font-bold text-primary-forte underline underline-offset-4"
          >
            Não chegou? Reenviar o link
          </Link>
        </div>

        <div className="rounded-card border border-neutro-border bg-superficie p-5">
          <span className="flex items-center gap-2 text-sm font-bold text-escuro">
            <LogIn className="h-4 w-4 shrink-0" strokeWidth={2} />
            Você já usava a Mimu
          </span>
          <p className="mt-2 text-sm leading-relaxed text-neutro-muted">
            Seu acesso já está liberado, com a mesma senha de sempre. Seus dados
            continuam onde estavam.
          </p>
          <Link
            href="/login"
            className="mt-3 inline-block text-sm font-bold text-primary-forte underline underline-offset-4"
          >
            Entrar na minha conta
          </Link>
        </div>
      </div>

      <a
        href={linkWhatsApp(
          "Oi! Acabei de comprar a Mimu e queria ajuda para entrar na minha conta.",
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex items-center gap-2 text-sm font-bold text-neutro-muted transition-colors hover:text-escuro"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={2} />
        Precisa de ajuda? Fale com a gente
      </a>
    </div>
  );
}
