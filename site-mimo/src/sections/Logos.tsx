import { useEffect, useState } from "react";
import { Img } from "../components/Img";

/*
 * Like <Stats>, this strip has no reveal of its own: it is the third child of
 * the hero's `Visual Wrapper` (framer-rosd92), and the wrapper carries one
 * appear animation for all of them — index.html's appearAnimationsContent:
 *   rosd92: initial { opacity: 0.001 }  ->  animate { opacity: 1 },
 *           transition { bounce: .1, delay: .7, duration: 1.2, type: "spring" }
 * On load, opacity only, no offset. The spring resolves to stiffness 49.95 /
 * damping 12.72 (mass 1, ratio 0.9), sampled at 24 steps.
 */
const APPEAR_MS = 1200;
const APPEAR_DELAY = 700;
const APPEAR_SPRING =
  "linear(0, 0.0506, 0.1641, 0.3007, 0.4369, 0.5605, 0.6662, 0.7526, 0.821, 0.8735, 0.9129, 0.9418, 0.9623, 0.9767, 0.9864, 0.9928, 0.9968, 0.9993, 1.0006, 1.0013, 1.0015, 1.0015, 1.0013, 1.0011, 1.0009)";

const LOGOS = [
  { file: "vUm0vA8Dmi1IMLYCkSq3igQufj0.png", w: 103 },
  { file: "RGWerGYxB7gPSTeSaNBn9AHsHs.png", w: 108 },
  { file: "U33wYOhqq6O4vefxlMnUx0olQpM.png", w: 95 },
  { file: "P2IsyypkpTAE44YCupLqzwsXIbc.png", w: 110 },
  { file: "FGRs57VIqVv8f6o8Tk6T5IIYL8.png", w: 140 },
  { file: "AIMSVje1JIVczKzZE97Em3GNiA.png", w: 116 },
];

/**
 * Logo strip under the hero visuals.
 * 111px tall: 18 label + 32 gap + 61 track. Measured on the original, where the
 * track is taller than the 28px logos it carries.
 *
 * A legenda deixou de falar dos "times que mais crescem no mundo" — o público
 * da Mimu é o comércio da esquina, e a linha agora nomeia esses negócios.
 */
export function Logos() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setOn(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className="flex w-full flex-col items-center gap-8"
      style={{
        opacity: on ? 1 : 0.001,
        transition: `opacity ${APPEAR_MS}ms ${APPEAR_SPRING} ${APPEAR_DELAY}ms`,
      }}
    >
      <p className="font-display text-sm leading-[18.2px] font-bold text-muted">
        Salões, barbearias, mercadinhos e lanchonetes já contam com a Mimu
      </p>

      {/* The mask hides the seam where the duplicated track wraps around. */}
      <div className="marquee-mask flex h-[61px] w-full items-center overflow-hidden">
        <ul className="marquee-track flex w-max items-center gap-10 md:gap-[60px]">
          {/* Two identical passes: the track scrolls exactly one pass, then resets. */}
          {[0, 1].map((pass) =>
            LOGOS.map((logo) => (
              <li key={`${pass}-${logo.file}`} className="shrink-0">
                <Img
                  src={`/img/${logo.file}`}
                  alt=""
                  width={logo.w}
                  height={28}
                  className="h-7 w-auto object-contain"
                />
              </li>
            )),
          )}
        </ul>
      </div>
    </div>
  );
}
