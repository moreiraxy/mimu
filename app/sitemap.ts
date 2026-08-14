import type { MetadataRoute } from "next";
import { PAGINAS_PUBLICAS, urlAbsoluta } from "@/lib/site";

/**
 * Só as páginas que um visitante deslogado consegue ver de verdade.
 *
 * Listar as telas do app aqui seria pior que não ter sitemap: o buscador
 * pediria cada endereço, levaria um redirect pro /login e concluiria que o
 * site tem várias páginas idênticas.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const agora = new Date();

  return PAGINAS_PUBLICAS.map(({ caminho, prioridade, frequencia }) => ({
    url: urlAbsoluta(caminho),
    lastModified: agora,
    changeFrequency: frequencia,
    priority: prioridade,
  }));
}
