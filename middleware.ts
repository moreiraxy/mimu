import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // robots.txt, sitemap.xml e llms.txt ficam de fora porque quem os busca
    // nunca tem sessão: sem esta exceção o middleware exige login e devolve
    // a página de /login no lugar do arquivo, então buscador e ferramenta de
    // IA jamais chegariam a lê-los.
    //
    // assets/, img/ e lp.html são os arquivos da landing page, e fonts/ serve
    // aos dois. Todos precisam sair daqui pelo mesmo motivo: quem visita a
    // landing não tem sessão, e sem a exceção o middleware devolveria a
    // página de login no lugar do .js e do .css — a landing carregaria em
    // branco para todo visitante novo, justamente quem ela existe para
    // atender.
    //
    // .well-known/ fica de fora porque quem busca o apple-app-site-association
    // é o iOS, sem sessão e sem seguir redirecionamento: se o middleware
    // devolvesse a página de login ali, o Universal Link falharia em silêncio
    // e o link do e-mail voltaria a abrir no navegador.
    //
    // As extensões cobrem o caso geral de arquivo estático; a lista de
    // imagens antiga não incluía js/css/woff2, que é o que a landing carrega.
    "/((?!_next/static|_next/image|\\.well-known/|favicon.ico|icon.svg|manifest.webmanifest|sw.js|robots.txt|sitemap.xml|llms.txt|lp.html|assets/|img/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|css|woff2?|ico|txt|map)$).*)",
  ],
};
