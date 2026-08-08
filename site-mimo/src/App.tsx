import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { CursorDot } from "./components/CursorDot";
import { useSmoothScroll } from "./hooks/useSmoothScroll";
import Home from "./pages/Home";
import "lenis/dist/lenis.css";

// Home ships in the initial bundle; every other route is split out.
const Contato = lazy(() => import("./pages/Contact"));
const Historias = lazy(() => import("./pages/CustomerStories"));
const Historia = lazy(() => import("./pages/CustomerStory"));
const Legal = lazy(() => import("./pages/Legal"));

export default function App() {
  useSmoothScroll();

  return (
    <BrowserRouter>
      <CursorDot />
      <Suspense fallback={null}>
        {/* Rotas em português: a URL é parte do que o visitante lê, e um site
            todo em pt-BR com /customer-stories na barra de endereço denuncia o
            template por baixo. Os slugs de história e de documento legal
            também são pt-BR — ver data/customerStories.ts e data/legal.ts. */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/historias" element={<Historias />} />
          <Route path="/historias/:slug" element={<Historia />} />
          <Route path="/legal/:slug" element={<Legal />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
