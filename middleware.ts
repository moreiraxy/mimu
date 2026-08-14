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
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest|sw.js|robots.txt|sitemap.xml|llms.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
