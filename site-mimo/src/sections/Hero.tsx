import { AnimatedText } from "../components/AnimatedText";
import { Button } from "../components/Button";
import { Revelar } from "../components/Revelar";
import { HeroVisualV2 } from "./HeroVisualV2";
import { Stats } from "./Stats";

/**
 * A prova social do topo. O site atual da Mimu empilha três iniciais coloridas
 * em vez de uma foto: são as mesmas três pessoas que assinam os depoimentos
 * mais abaixo (Andréia, Rodrigo, Carol), e cada uma leva uma cor da paleta.
 * O `z-index` desce para a primeira ficar por cima da seguinte.
 */
const ROSTOS = [
  // Verde neon (bg-coral/primary) é claro demais pra iniciais brancas — só
  // este precisa de texto preto; verde/âmbar continuam com branco.
  { iniciais: "AN", cor: "bg-coral", texto: "text-primary-text" },
  { iniciais: "RO", cor: "bg-verde", texto: "text-white" },
  { iniciais: "CA", cor: "bg-ambar", texto: "text-white" },
];

export function Hero() {
  return (
    <section className="bg-bg pt-[120px] pb-20 md:pt-[140px] md:pb-24 lg:pt-40 lg:pb-30">
      <div className="container-page flex flex-col items-center gap-10 md:gap-[60px]">
        <div className="flex flex-col items-center gap-5 text-center">
          <Revelar className="flex items-center gap-3">
            <div className="flex">
              {ROSTOS.map((rosto, i) => (
                <span
                  key={rosto.iniciais}
                  aria-hidden="true"
                  className={`-ml-2.5 flex size-8 items-center justify-center rounded-full border-2 border-bg text-[10px] font-extrabold first:ml-0 ${rosto.cor} ${rosto.texto}`}
                  style={{ zIndex: ROSTOS.length - i }}
                >
                  {rosto.iniciais}
                </span>
              ))}
            </div>
            <span className="font-display text-sm font-bold tracking-[-0.28px] text-muted-strong">
              +400 negócios de bairro já usam a Mimu
            </span>
          </Revelar>

          <AnimatedText
            as="h1"
            text={"Enquanto você trabalha,\na Mimu cuida do seu negócio."}
            className="font-display text-[40px] leading-[1.1] font-extrabold tracking-[-1.2px] text-ink md:text-[52px] md:tracking-[-1.56px] lg:text-[64px] lg:leading-[70.4px] lg:tracking-[-1.92px]"
          />

          <Revelar atraso={220}>
            <p className="max-w-[620px] font-display text-base leading-[1.4] font-medium tracking-[-0.32px] text-muted-strong md:text-lg lg:text-xl lg:leading-[28px] lg:tracking-[-0.4px]">
              Assistente de gestão para microempreendedores de bairro: vendas,
              faturamento, agenda e clientes em um só lugar.
            </p>
          </Revelar>

          <Revelar atraso={340} className="mt-2 flex flex-col items-center gap-3">
            <Button to="/cadastro">Começar grátis por 7 dias</Button>
            <p className="text-xs text-muted">
              Sem cartão de crédito. Cancele quando quiser.
            </p>
          </Revelar>
        </div>

        {/* O visual entra depois do texto: sem isso ele aparecia junto e
            disputava a leitura logo no primeiro quadro. */}
        <Revelar atraso={460} deslocamento={28} className="w-full">
          <HeroVisualV2 />
        </Revelar>

        <Revelar atraso={120} className="w-full">
          <Stats />
        </Revelar>
      </div>
    </section>
  );
}
