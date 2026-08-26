import { BrowserRouter } from "react-router";
import { Rotas } from "./Rotas";
import { useSmoothScroll } from "./hooks/useSmoothScroll";
import { useParallaxFloat } from "./hooks/useParallaxFloat";
import { useAnimateOnView } from "./hooks/useAnimateOnView";
import "lenis/dist/lenis.css";

export default function App() {
  useSmoothScroll();
  useParallaxFloat();
  useAnimateOnView();

  return (
    <BrowserRouter>
      <Rotas />
    </BrowserRouter>
  );
}
