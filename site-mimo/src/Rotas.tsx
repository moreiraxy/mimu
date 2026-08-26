import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { CursorDot } from "./components/CursorDot";
import { Preloader } from "./components/Preloader";
import { IrAoTopo } from "./components/IrAoTopo";
import Home from "./pages/Home";

// Home ships in the initial bundle; every other route is split out.
const Historias = lazy(() => import("./pages/CustomerStories"));
const Historia = lazy(() => import("./pages/CustomerStory"));
const Legal = lazy(() => import("./pages/Legal"));

/**
 * O miolo do site, sem o router em volta.
 *
 * Existe separado de App porque o mesmo conteúdo é montado de dois jeitos: no
 * navegador com BrowserRouter, e no build com StaticRouter, para gerar o HTML
 * que o buscador lê. Sem essa separação o BrowserRouter viria junto e pediria
 * um `window` que não existe dentro do Node.
 */
export function Rotas() {
  return (
    <>
      {/* Dentro do router de propósito: eles leem a rota atual, e fora daqui
          não teriam acesso a ela. */}
      <IrAoTopo />
      <Preloader />
      <CursorDot />
      <Suspense fallback={null}>
        {/* Rotas em português: a URL é parte do que o visitante lê, e um site
            todo em pt-BR com /customer-stories na barra de endereço denuncia o
            template por baixo. Os slugs de história e de documento legal
            também são pt-BR, ver data/customerStories.ts e data/legal.ts. */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/historias" element={<Historias />} />
          <Route path="/historias/:slug" element={<Historia />} />
          <Route path="/legal/:slug" element={<Legal />} />
        </Routes>
      </Suspense>
    </>
  );
}
