import { Header } from "../components/Header";
import { Faqs } from "../sections/Faqs";
import { Footer } from "../sections/Footer";
import { Hero } from "../sections/Hero";
import { Security } from "../sections/Security";
import { Testimonials } from "../sections/Testimonials";
import { FeaturesV2 } from "../sections/FeaturesV2";
import { PricingV2 } from "../sections/PricingV2";
import { RaioX } from "../sections/RaioX";

// Integrations ("Tudo num lugar só" / "Caderno, planilha ou memória") saiu da
// composição a pedido — o arquivo continua no repo, só não é mais montado.
// CtaV2 também saiu: quem faz o papel de chamada pra ação é o questionário.
//
// Ordem: a prova social (Depoimentos) entrega direto no questionário, que é
// o convite mais leve que o cadastro. Preço vem no fim, depois de Segurança,
// e o FAQ fecha respondendo o que trava a decisão de assinar.
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FeaturesV2 />
        <Testimonials />
        <RaioX />
        <Security />
        <PricingV2 />
        <Faqs />
      </main>
      {/* The original closes the document with <footer> outside <main>. */}
      <Footer />
    </>
  );
}
