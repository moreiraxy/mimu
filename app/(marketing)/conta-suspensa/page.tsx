import { ShieldAlert, MessageCircle } from "lucide-react";
import { Logo } from "@/components/Logo";
import { linkWhatsApp } from "@/lib/contato";

// Onde cai quem teve a conta suspensa pelo painel admin.
//
// De propósito não tem botão de pagar: suspensão não se resolve pagando (esse
// é o caminho de /trial-vencido). O único caminho daqui é falar com o suporte,
// senão a pessoa fica tentando assinar e voltando pra cá em loop.
//
// Também de propósito não mostra o motivo registrado pelo admin: ele é uma
// anotação interna, escrita para a dona do produto se lembrar depois, não um
// texto revisado para ser lido por quem foi suspensa.
export default function ContaSuspensaPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary-light px-6 py-10 text-center">
      <Logo size="md" />

      <span className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-ambar-light text-ambar-texto">
        <ShieldAlert className="h-7 w-7" strokeWidth={1.75} />
      </span>

      <h1 className="mt-6 text-2xl font-semibold text-escuro">
        Sua conta está suspensa.
      </h1>
      <p className="mt-2 max-w-sm text-sm text-neutro-muted">
        O acesso à Mimu foi pausado. Seus dados continuam guardados. Fale com a
        gente para entender o motivo e resolver.
      </p>

      <a
        href={linkWhatsApp(
          "Oi! Minha conta na Mimu foi suspensa e eu queria entender o motivo.",
        )}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 flex w-full max-w-xs items-center justify-center gap-1.5 rounded-button bg-primary py-3.5 text-sm font-bold text-primary-text transition-colors hover:bg-primary-hover"
      >
        <MessageCircle className="h-4 w-4" strokeWidth={2.25} />
        Falar com suporte
      </a>
    </div>
  );
}
