import Link from "next/link";
import { Clock, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { VALOR_MENSAL_MIMU } from "@/lib/planos";

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
        Continue com a Mimu por R$ {VALOR_MENSAL_MIMU}/mês e nunca perca o
        controle do seu negócio.
      </p>

      <Link
        href="/assinar"
        className="mt-8 w-full max-w-xs rounded-button bg-primary py-3.5 text-center text-sm font-bold text-primary-text transition-colors hover:bg-primary-hover"
      >
        Assinar agora
      </Link>

      <a
        href="mailto:suporte@mimu.app"
        className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-primary-forte"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
        Falar com suporte
      </a>
    </div>
  );
}
