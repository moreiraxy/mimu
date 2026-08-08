/* Gerado por tools/gen-app.mjs — compoe o clone a partir dos componentes
   de secao. Os comportamentos ficam no fim, na ordem do documento
   original: o useEffect de cada um roda nessa mesma ordem. */

import Chrome from '@/components/chrome';
import Nav from '@/components/nav';
import Section01 from '@/components/sections/section-01';
import Section02 from '@/components/sections/section-02';
import Section03 from '@/components/sections/section-03';
import Section04 from '@/components/sections/section-04';
import Section05 from '@/components/sections/section-05';
import Section06 from '@/components/sections/section-06';
import Section07 from '@/components/sections/section-07';
import Section08 from '@/components/sections/section-08';
import Section09 from '@/components/sections/section-09';
import Section10 from '@/components/sections/section-10';
import Footer from '@/components/footer';
import NavBanner from '@/components/behaviors/nav-banner';
import ParallaxFloat from '@/components/behaviors/parallax-float';
import Tabs from '@/components/behaviors/tabs';
import Accordion from '@/components/behaviors/accordion';
import Marquee from '@/components/behaviors/marquee';
import DynamicYear from '@/components/behaviors/dynamic-year';
import Effects from '@/components/behaviors/effects';
import QrCode from '@/components/behaviors/qr-code';
import LenisInit from '@/components/behaviors/lenis-init';
import AnimateOnView from '@/components/behaviors/animate-on-view';

export default function Home() {
  return (
    <>
      <div className="page_wrap">
        <Chrome />
        <Nav />
        <main id="main" className="page_main">
          <Section01 />
          <Section02 />
          <Section03 />
          <Section04 />
          <Section05 />
          <Section06 />
          <Section07 />
          <Section08 />
          <Section09 />
          <Section10 />
        </main>
        <Footer />
      </div>
      <NavBanner />
      <ParallaxFloat />
      <Tabs />
      <Accordion />
      <Marquee />
      <DynamicYear />
      <Effects />
      <QrCode />
      <LenisInit />
      <AnimateOnView />
    </>
  );
}
