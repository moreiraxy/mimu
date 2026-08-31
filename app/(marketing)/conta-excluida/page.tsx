import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/Logo";

/**
 * A despedida de quem apagou a própria conta.
 *
 * É pública porque precisa ser: o usuário do auth deixou de existir um
 * instante antes de chegar aqui, então não há sessão nenhuma para exigir.
 * Ver a lista ALWAYS_PUBLIC_ROUTES em lib/supabase/middleware.ts.
 *
 * Não tem preço, não tem plano e não tem botão de assinar — nem aqui nem em
 * lugar nenhum que o app iOS alcance. Esta tela é alcançável de dentro do
 * app, e a diretriz 3.1.3(f) da Apple proíbe chamada para pagamento fora
 * dele. "Criar outra conta" pode ficar: cadastro é gratuito e leva ao teste,
 * não ao checkout.
 *
 * O tom é de porta aberta, não de arrependimento. Quem apagou a conta tomou
 * uma decisão; insistir aqui seria falar por cima dela.
 */
export default function ContaExcluidaPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary-light px-6 py-10 text-center">
      <Logo size="md" />

      <span className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-verde-light text-verde-dark">
        <CheckCircle2 className="h-7 w-7" strokeWidth={1.75} />
      </span>

      <h1 className="mt-6 text-2xl font-semibold text-escuro">
        Pronto, apagamos tudo.
      </h1>
      <p className="mt-2 max-w-sm text-sm text-neutro-muted">
        Sua conta e tudo que estava nela já não existem mais nos nossos
        servidores. Obrigada por ter usado a Mimu — a porta fica aberta se um
        dia você quiser voltar.
      </p>

      <Link
        href="/cadastro"
        className="mt-8 flex w-full max-w-xs items-center justify-center rounded-button bg-primary py-3.5 text-sm font-bold text-primary-text transition-colors hover:bg-primary-hover"
      >
        Criar outra conta
      </Link>
    </div>
  );
}
