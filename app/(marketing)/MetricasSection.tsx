import { SpringIn } from "@/components/marketing/SpringIn";
import { ParallaxFloat } from "@/components/marketing/ParallaxFloat";
import { VALOR_MENSAL_MIMU } from "@/lib/planos";

const METRICAS = [
  { valor: "7 dias", legenda: "grátis para começar" },
  { valor: `R$ ${VALOR_MENSAL_MIMU}`, legenda: "por mês depois" },
  { valor: "2 min", legenda: "para configurar tudo" },
] as const;

export function MetricasSection() {
  return (
    <section className="px-5 py-12 sm:px-6 sm:py-16">
      <ParallaxFloat strength={80} className="mx-auto max-w-3xl">
        <SpringIn>
          <div className="flex flex-wrap justify-center gap-8 rounded-card border border-neutro-border bg-superficie px-8 py-10 text-center shadow-sm sm:gap-16 sm:px-12 sm:py-12">
            {METRICAS.map((metrica) => (
              <div key={metrica.legenda}>
                <p className="font-display text-4xl font-bold tracking-tight text-coral sm:text-5xl">
                  {metrica.valor}
                </p>
                <p className="mt-2 text-sm text-neutro-muted">{metrica.legenda}</p>
              </div>
            ))}
          </div>
        </SpringIn>
      </ParallaxFloat>
    </section>
  );
}
