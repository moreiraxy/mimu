import { SpringIn } from "@/components/marketing/SpringIn";

const DEPOIMENTOS = [
  {
    texto:
      "Antes eu não sabia se estava dando lucro. Hoje a Mimu me manda um resumo todo dia — mudou como eu penso o salão.",
    nome: "Andréia",
    negocio: "Salão da Andréia",
    iniciais: "AN",
    cor: "bg-coral",
  },
  {
    texto:
      "Uso pra controlar fiado e estoque no mesmo lugar. A Mimu lembra quem me deve antes que eu esqueça.",
    nome: "Rodrigo",
    negocio: "Mercadinho do Rodrigo",
    iniciais: "RO",
    cor: "bg-verde",
  },
  {
    texto:
      "Recomendo pra toda amiga que também trabalha por conta. É simples, e parece que fizeram pensando em mim.",
    nome: "Carol",
    negocio: "Manicure da Carol",
    iniciais: "CA",
    cor: "bg-ambar",
  },
] as const;

export function DepoimentosSection() {
  return (
    <section id="depoimentos" className="bg-superficie px-5 py-16 sm:px-6 sm:py-24">
      <SpringIn>
        <h2 className="mx-auto max-w-2xl text-center font-display text-[1.6rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
          Quem já usa, não volta pro caderno.
        </h2>
      </SpringIn>

      <div className="mx-auto mt-10 flex max-w-5xl flex-col gap-4 sm:mt-14 sm:flex-row">
        {DEPOIMENTOS.map((depoimento, indice) => (
          <SpringIn key={depoimento.nome} delay={indice * 0.1} className="flex-1">
            <div className="flex h-full flex-col rounded-card border border-neutro-border bg-fundo p-6 shadow-sm">
              <p className="flex-1 text-[15px] leading-relaxed text-escuro">
                “{depoimento.texto}”
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white ${depoimento.cor}`}
                >
                  {depoimento.iniciais}
                </div>
                <div>
                  <p className="text-sm font-bold text-escuro">{depoimento.nome}</p>
                  <p className="text-xs text-neutro-muted">{depoimento.negocio}</p>
                </div>
              </div>
            </div>
          </SpringIn>
        ))}
      </div>
    </section>
  );
}
