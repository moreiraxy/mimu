import Link from "next/link";
import { Check } from "lucide-react";
import { SpringIn } from "@/components/marketing/SpringIn";
import { VALOR_MENSAL_MIMU } from "@/lib/planos";

const ITENS_INCLUIDOS = [
  "Agenda e clientes ilimitados",
  "Controle financeiro completo",
  "Faturamento previsto",
  "Assistente Mimu com IA",
  "Produtos e estoque",
  "Funciona offline",
] as const;

export function PrecoSection() {
  return (
    <section id="preco" className="px-5 py-16 sm:px-6 sm:py-24">
      <SpringIn>
        <h2 className="mx-auto max-w-xl text-center font-display text-[1.6rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
          Menos que uma pizza por mês.
        </h2>
      </SpringIn>
      <SpringIn delay={0.05}>
        <p className="mx-auto mt-3 max-w-sm text-center text-[15px] text-neutro-muted">
          14 dias grátis para testar. Sem cartão de crédito.
        </p>
      </SpringIn>

      <SpringIn delay={0.1}>
        <div className="relative mx-auto mt-10 max-w-md rounded-[26px] border-[1.5px] border-coral bg-coral-light px-8 py-11 text-center shadow-2xl shadow-coral/20 sm:mt-12">
          <p className="text-sm font-bold text-neutro-muted">Mimu Completo</p>
          <p className="mt-2 flex items-baseline justify-center gap-1.5">
            <span className="font-display text-5xl font-bold tracking-tight text-escuro">
              R$ {VALOR_MENSAL_MIMU}
            </span>
            <span className="text-sm text-neutro-muted">/mês</span>
          </p>

          <ul className="mt-8 flex flex-col gap-3 text-left">
            {ITENS_INCLUIDOS.map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <Check className="h-[17px] w-[17px] flex-shrink-0 text-verde" strokeWidth={2.6} />
                <p className="text-sm text-escuro">{item}</p>
              </li>
            ))}
          </ul>

          <Link
            href="/cadastro"
            className="mt-8 flex w-full items-center justify-center rounded-full bg-coral py-3.5 text-[15px] font-bold text-white shadow-lg shadow-coral/30 transition-transform duration-150 hover:bg-coral-hover active:scale-[0.97]"
          >
            Começar com 14 dias grátis
          </Link>
          <p className="mt-3 text-xs text-neutro-muted">
            Sem cartão de crédito. Cancele quando quiser.
          </p>
        </div>
      </SpringIn>
    </section>
  );
}
