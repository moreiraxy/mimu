import { AnimatedText } from "../components/AnimatedText";
import { Button } from "../components/Button";
import { Img } from "../components/Img";
import { Logos } from "./Logos";
import { Stats } from "./Stats";

/**
 * A prova social do topo. O site atual da Mimu empilha três iniciais coloridas
 * em vez de uma foto: são as mesmas três pessoas que assinam os depoimentos
 * mais abaixo (Andréia, Rodrigo, Carol), e cada uma leva uma cor da paleta.
 * O `z-index` desce para a primeira ficar por cima da seguinte.
 */
const ROSTOS = [
  { iniciais: "AN", cor: "bg-coral" },
  { iniciais: "RO", cor: "bg-verde" },
  { iniciais: "CA", cor: "bg-ambar" },
];

export function Hero() {
  return (
    <section className="bg-cream pt-[120px] pb-20 md:pt-[140px] md:pb-24 lg:pt-40 lg:pb-30">
      <div className="container-page flex flex-col items-center gap-10 md:gap-[60px]">
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="flex items-center gap-3">
            <div className="flex">
              {ROSTOS.map((rosto, i) => (
                <span
                  key={rosto.iniciais}
                  aria-hidden="true"
                  className={`-ml-2.5 flex size-8 items-center justify-center rounded-full border-2 border-cream text-[10px] font-extrabold text-white first:ml-0 ${rosto.cor}`}
                  style={{ zIndex: ROSTOS.length - i }}
                >
                  {rosto.iniciais}
                </span>
              ))}
            </div>
            <span className="font-display text-sm font-bold tracking-[-0.28px] text-muted-strong">
              +400 negócios de bairro já usam a Mimu
            </span>
          </div>

          <AnimatedText
            as="h1"
            text={"Enquanto você trabalha,\na Mimu cuida do seu negócio."}
            className="font-display text-[40px] leading-[1.1] font-extrabold tracking-[-1.2px] text-ink md:text-[52px] md:tracking-[-1.56px] lg:text-[64px] lg:leading-[70.4px] lg:tracking-[-1.92px]"
          />

          <p className="max-w-[620px] font-display text-base leading-[1.4] font-medium tracking-[-0.32px] text-muted-strong md:text-lg lg:text-xl lg:leading-[28px] lg:tracking-[-0.4px]">
            Assistente de gestão para microempreendedores de bairro: vendas,
            faturamento, agenda e clientes em um só lugar.
          </p>

          <div className="mt-2 flex flex-col items-center gap-3">
            <Button to="/contato">Começar grátis por 7 dias</Button>
            <p className="text-xs text-muted">
              Sem cartão de crédito. Cancele quando quiser.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 md:flex-row md:items-center">
          <VisualLeft />
          <VisualRight />
        </div>

        <Logos />
        <Stats />
      </div>
    </section>
  );
}

/** Portrait shot with the translucent card floating over its bottom-right. */
function VisualLeft() {
  return (
    <div className="relative aspect-[411/537] w-full overflow-clip rounded-xl p-3 md:w-[34.25%]">
      <Img
        src="/img/mXLGT74AMXrCDUC76H70XyIFo.jpg"
        alt="Dona de salão atendendo uma cliente enquanto usa a Mimu no celular"
        width={411}
        height={537}
        priority
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute top-[55.5%] left-[50%] h-[27%] w-[59.9%] rounded-md bg-cream/85" />
      <Img
        src="/img/ag0UpfKucuKm8gxVHsEkIObwOMo.jpg"
        alt=""
        width={296}
        height={174}
        priority
        className="absolute top-[59.8%] left-[13.9%] w-[72%] rounded-md object-cover"
      />
    </div>
  );
}

/** Wide shot with the dashboard panel offset into the frame. */
function VisualRight() {
  return (
    <div className="relative aspect-[773/537] w-full overflow-clip rounded-xl md:w-[64.4%]">
      <Img
        src="/img/TSJEmo3HFim46DqBxHZOxuASA.jpg"
        alt=""
        width={773}
        height={537}
        priority
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute top-[11.2%] left-[7.8%] w-full rounded-xl bg-cream/30 p-4">
        <Img
          src="/img/ukrBv5NrrzKfRN85WXHmuQicDk.jpg"
          alt="Painel da Mimu com o faturamento do dia e a agenda"
          width={741}
          height={560}
          priority
          className="w-full rounded-lg object-cover"
        />
      </div>
    </div>
  );
}
