import Link from "next/link";
import { HeroPerguntas } from "@/components/marketing/HeroPerguntas";

export function HeroSection() {
  return (
    <section className="flex flex-col items-center px-5 pb-16 pt-28 text-center sm:px-6 sm:pb-20 sm:pt-40 lg:pt-48">
      <h1 className="max-w-3xl text-[2rem] font-bold leading-[1.1] tracking-tight text-escuro sm:text-5xl lg:text-6xl">
        Enquanto você trabalha, a Mimu cuida do seu negócio.
      </h1>
      <p className="mt-4 max-w-xl text-[15px] text-neutro-muted sm:mt-5 sm:text-lg">
        O app que organiza salões, barbearias e pequenos negócios de bairro —
        sem planilha, sem complicação.
      </p>

      <div className="mt-7 w-full sm:mt-8">
        <HeroPerguntas />
      </div>

      <Link
        href="/cadastro"
        className="mt-7 w-full max-w-xs rounded-button bg-coral py-3.5 text-sm font-bold text-white shadow-sm transition-transform duration-150 hover:bg-coral-hover active:scale-[0.97] sm:mt-8 sm:w-auto sm:max-w-none sm:px-7 sm:text-base"
      >
        Começar grátis por 14 dias
      </Link>
      <p className="mt-3 text-xs text-neutro-muted">Sem cartão de crédito</p>
    </section>
  );
}
