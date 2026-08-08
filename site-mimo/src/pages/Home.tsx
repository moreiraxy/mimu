import { Header } from "../components/Header";
import { Faqs } from "../sections/Faqs";
import { Footer } from "../sections/Footer";
import { Hero } from "../sections/Hero";
import { Integrations } from "../sections/Integrations";
import { Security } from "../sections/Security";
import { Testimonials } from "../sections/Testimonials";
import { FeaturesV2 } from "../sections/FeaturesV2";
import { PricingV2 } from "../sections/PricingV2";
import { CtaV2 } from "../sections/CtaV2";

// Ordem de mesclagem site-v2 + site-mimo (ver /interno/merge):
// 1 Header, 2-4 Hero (texto+métricas mimo / visual v2), 5 Features (v2),
// 6 Integrations (mimo), 7 Pricing (v2), 8 Testimonials (mimo),
// 9 Security (mimo), 10 Faqs (mimo), 11 Cta (v2), 12 Footer (mimo).
// HowItWorks, WhoWeServe e CustomerStories saem da composição (não
// listadas no pedido de mesclagem) — os arquivos continuam no repo.
export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <FeaturesV2 />
        <Integrations />
        <PricingV2 />
        <Testimonials />
        <Security />
        <Faqs />
        <CtaV2 />
      </main>
      {/* The original closes the document with <footer> outside <main>. */}
      <Footer />
    </>
  );
}
