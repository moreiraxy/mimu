import Link from "next/link";
import { Check } from "lucide-react";
import { SpringIn } from "@/components/marketing/SpringIn";
import { VALOR_MENSAL_MIMU } from "@/lib/planos";

const ITENS_INCLUIDOS = [
  "Agenda e Clientes ilimitados",
  "Controle financeiro completo",
  "Faturamento previsto",
  "Assistente Mimu com IA",
  "Produtos e Estoque",
  "Funciona offline",
  "Suporte via chat",
] as const;

export function PrecoSection() {
  return (
    <section className="px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-md">
        <SpringIn>
          <h2 className="text-center text-[1.375rem] font-bold leading-tight text-escuro sm:text-3xl">
            Menos que uma pizza por mês.
          </h2>
        </SpringIn>

        <SpringIn delay={0.1}>
          <div className="mt-8 rounded-card border border-neutro-border bg-superficie p-5 shadow-sm sm:mt-10 sm:p-7">
            <p className="text-center text-sm font-semibold text-neutro-muted">
              Mimu Completo
            </p>
            <p className="mt-1 flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-coral">
                R$ {VALOR_MENSAL_MIMU}
              </span>
              <span className="text-sm text-neutro-muted">/mês</span>
            </p>

            <ul className="mt-6 flex flex-col gap-3">
              {ITENS_INCLUIDOS.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-escuro">
                  <Check className="h-4 w-4 flex-shrink-0 text-verde" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>

            <p className="mt-6 text-center text-xs font-semibold text-verde-dark">
              14 dias grátis, sem cartão de crédito
            </p>

            <Link
              href="/cadastro"
              className="mt-5 flex items-center justify-center rounded-button bg-coral py-3.5 text-sm font-bold text-white transition-transform duration-150 hover:bg-coral-hover active:scale-[0.97]"
            >
              Começar agora
            </Link>
          </div>
        </SpringIn>
      </div>
    </section>
  );
}
