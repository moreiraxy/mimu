import { SpringIn } from "@/components/marketing/SpringIn";
import { ParallaxFloat } from "@/components/marketing/ParallaxFloat";
import { EntradaMockup } from "@/components/marketing/EntradaMockup";

const DEPOIMENTOS = [
  {
    texto:
      "Antes eu não sabia se estava dando lucro. Hoje a Mimu me manda um resumo todo dia, mudou como eu penso o salão.",
    nome: "Andréia",
    negocio: "Salão da Andréia",
    iniciais: "AN",
    cor: "bg-coral",
    parallax: 70,
  },
  {
    texto:
      "Uso pra controlar fiado e estoque no mesmo lugar. A Mimu lembra quem me deve antes que eu esqueça.",
    nome: "Rodrigo",
    negocio: "Mercadinho do Rodrigo",
    iniciais: "RO",
    cor: "bg-verde",
    parallax: 45,
  },
  {
    texto:
      "Recomendo pra toda amiga que também trabalha por conta. É simples, e parece que fizeram pensando em mim.",
    nome: "Carol",
    negocio: "Manicure da Carol",
    iniciais: "CA",
    cor: "bg-ambar",
    parallax: 95,
  },
] as const;

export function DepoimentosSection() {
  return (
    <section id="depoimentos" className="bg-superficie px-4 py-[48px] sm:px-6 lg:py-[80px]">
      <SpringIn>
        <h2 className="mx-auto max-w-2xl text-center font-display text-[1.6rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
          Quem já usa, não volta pro caderno.
        </h2>
      </SpringIn>

      <div className="mx-auto mt-10 grid max-w-[1200px] grid-cols-1 items-stretch gap-6 sm:mt-14 sm:grid-cols-3">
        {DEPOIMENTOS.map((depoimento, indice) => (
          <ParallaxFloat
            key={depoimento.nome}
            strength={depoimento.parallax}
            className="h-full"
          >
            <EntradaMockup delay={indice * 0.1}>
              <div className="flex h-full flex-col rounded-[22px] border border-neutro-border bg-fundo p-[34px] shadow-sm">
                <p className="flex-1 text-base leading-relaxed text-escuro">
                  “{depoimento.texto}”
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className={`flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white ${depoimento.cor}`}
                  >
                    {depoimento.iniciais}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-escuro">{depoimento.nome}</p>
                    <p className="text-xs text-neutro-muted">{depoimento.negocio}</p>
                  </div>
                </div>
              </div>
            </EntradaMockup>
          </ParallaxFloat>
        ))}
      </div>
    </section>
  );
}
