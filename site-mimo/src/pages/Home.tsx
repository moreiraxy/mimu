import { Header } from "../components/Header";
import { Pricing } from "../sections/Pricing";
import { Cta } from "../sections/Cta";
import { Faqs } from "../sections/Faqs";
import { Features } from "../sections/Features";
import { Footer } from "../sections/Footer";
import { Hero } from "../sections/Hero";
import { HowItWorks } from "../sections/HowItWorks";
import { Integrations } from "../sections/Integrations";
import { CustomerStories } from "../sections/CustomerStories";
import { WhoWeServe } from "../sections/WhoWeServe";
import { Security } from "../sections/Security";
import { Testimonials } from "../sections/Testimonials";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Integrations />
        <WhoWeServe />
        <Testimonials />
        <CustomerStories />
        <Pricing />
        <Security />
        <Faqs />
        <Cta />
      </main>
      {/* The original closes the document with <footer> outside <main>. */}
      <Footer />
    </>
  );
}
