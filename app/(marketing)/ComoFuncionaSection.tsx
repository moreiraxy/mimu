import { SpringIn } from "@/components/marketing/SpringIn";

const PASSOS = [
  "Crie sua conta em 2 minutos",
  "Diga o que quer controlar",
  "A Mimu cuida do resto",
] as const;

export function ComoFuncionaSection() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16 sm:px-6 sm:py-24">
      <SpringIn>
        <h2 className="text-center text-[1.375rem] font-bold leading-tight text-escuro sm:text-3xl">
          Simples assim.
        </h2>
      </SpringIn>

      <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:gap-6">
        {PASSOS.map((passo, indice) => (
          <SpringIn key={passo} delay={indice * 0.12} className="flex-1">
            <div className="flex h-full flex-row items-center gap-4 rounded-card border border-neutro-border bg-superficie p-5 text-left sm:flex-col sm:gap-3 sm:p-7 sm:text-center">
              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-coral text-sm font-bold text-white">
                {indice + 1}
              </span>
              <p className="text-sm font-semibold text-escuro">{passo}</p>
            </div>
          </SpringIn>
        ))}
      </div>
    </section>
  );
}
