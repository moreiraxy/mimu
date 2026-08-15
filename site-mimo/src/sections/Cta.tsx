import { AnimatedText } from "../components/AnimatedText";
import { Button } from "../components/Button";
import { Img } from "../components/Img";

/** Closing CTA: a photo card with a scrim, heading and pill button. */
export function Cta() {
  return (
    <section id="comecar" className="w-full bg-bg py-10 lg:py-15">
      <div className="container-page">
        <div className="relative z-2 flex flex-col items-center gap-4 overflow-clip rounded-xl py-30 md:gap-5">
        {/* Aqui havia a mesma aquarela do template. Trocada pela superfície da
            marca: um bloco de chamada não precisa de foto emprestada. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-xl bg-superficie"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

          {/* Scrim: 160% tall and offset a pixel left, exactly as measured.
              O gradiente saiu do preto do template para o escuro da marca
              (#1E1E2E), o manual não admite preto puro nem em sobreposição. */}
          <div
            aria-hidden="true"
            className="absolute top-0 left-[-1px] -z-10 h-[160%] w-full opacity-50"
            style={{
              background:
                "linear-gradient(180deg, rgb(30, 30, 46) -30%, rgba(30, 30, 46, 0) 61%)",
            }}
          />

          <AnimatedText
            text={"A Mimu cuida de\ntudo isso por você."}
            className="w-[90%] max-w-[650px] text-center font-display text-[39px] leading-[1.05] font-extrabold tracking-[-0.04em] text-white md:max-w-[850px] md:text-[44px] lg:w-[80%] lg:text-[56px] lg:tracking-[-0.03em] xl:text-[64px] xl:tracking-[-0.04em]"
          />

          <p className="text-sm font-bold text-white/85">
            Só precisa de 2 minutos para começar.
          </p>

          <Button to="/cadastro" variant="light">
            Começar agora, 7 dias grátis
          </Button>
        </div>
      </div>
    </section>
  );
}
