import type { MetadataRoute } from "next";
import { URL_SITE, urlAbsoluta } from "@/lib/site";

/**
 * Gerado em vez de ser um arquivo estático em public/ porque o endereço do
 * sitemap precisa ser absoluto, e ele muda entre ambientes.
 *
 * O `disallow` cobre o app inteiro. Não é segurança — essas rotas já exigem
 * login, e robots.txt não impede ninguém de acessar nada. É para o buscador
 * não gastar rastreamento em páginas que, pra ele, são todas a mesma tela de
 * login, e para nenhum endereço interno acabar listado numa busca.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin",
          "/dashboard",
          "/agenda",
          "/financeiro",
          "/clientes",
          "/produtos",
          "/metas",
          "/mimu",
          "/minha-empresa",
          "/onboarding",
          "/assinar",
          "/trial-vencido",
          "/conta-suspensa",
          "/bem-vindo",
          // Telas de conta: indexá-las só rende resultado de busca inútil.
          "/login",
          "/recuperar-senha",
          "/redefinir-senha",
        ],
      },
    ],
    sitemap: urlAbsoluta("/sitemap.xml"),
    host: URL_SITE,
  };
}
