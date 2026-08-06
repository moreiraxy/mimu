import { Sparkles, Star, TrendingUp } from "lucide-react";
import { SpringIn } from "@/components/marketing/SpringIn";

const FEATURES = [
  {
    icone: TrendingUp,
    titulo: "Faturamento previsto",
    descricao: "Sabe quanto vai entrar antes de entrar.",
  },
  {
    icone: Sparkles,
    titulo: "Mimu IA",
    descricao: "Registra e responde perguntas em segundos.",
  },
  {
    icone: Star,
    titulo: "Clientes Fiéis",
    descricao: "Reconhece quem sempre volta.",
  },
] as const;

export function SolucaoSection() {
  return (
    <section className="bg-superficie px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-4xl">
        <SpringIn>
          <h2 className="text-center text-[1.375rem] font-bold leading-tight text-escuro sm:text-3xl">
            Com a Mimu, é diferente.
          </h2>
        </SpringIn>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
          {FEATURES.map((feature, indice) => (
            <SpringIn key={feature.titulo} delay={indice * 0.1}>
              <div className="flex h-full flex-row items-start gap-4 rounded-card border border-neutro-border bg-fundo p-5 text-left sm:flex-col sm:items-center sm:gap-3 sm:p-7 sm:text-center">
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-coral-light text-coral sm:h-12 sm:w-12">
                  <feature.icone className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-escuro">
                    {feature.titulo}
                  </p>
                  <p className="mt-0.5 text-sm text-neutro-muted sm:mt-0">
                    {feature.descricao}
                  </p>
                </div>
              </div>
            </SpringIn>
          ))}
        </div>
      </div>
    </section>
  );
}
