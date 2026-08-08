import { AnimatedText } from "../components/AnimatedText";
import { Button } from "../components/Button";
import { Container } from "../components/Container";

/**
 * Portado de site-v2/components/sections/section-09.tsx — título, subtexto
 * e botão idênticos. O selo abaixo do botão no original diz "Segurança
 * bancária · Open Finance · Cadastro em 30 segundos" — claim regulatório
 * da Pierre (a mesma categoria de risco já sinalizada no comparativo dos
 * dois sites). Removido aqui em vez de portado; sinalizado no relatório.
 */
export function CtaV2() {
  return (
    <section className="bg-cream py-20 md:py-28 lg:py-[120px]">
      <Container className="flex flex-col items-center gap-6 text-center">
        <AnimatedText
          as="h2"
          text={"Pronto pra organizar\nsuas finanças?"}
          className="font-display text-[32px] font-extrabold tracking-[-0.96px] text-ink md:text-[40px] md:tracking-[-1.2px]"
        />
        <p className="max-w-[420px] text-base text-muted-strong md:text-lg">
          Comece agora. É rápido, seguro e o plano básico é grátis.
        </p>
        <Button to="/contato">Começar grátis</Button>
      </Container>
    </section>
  );
}
