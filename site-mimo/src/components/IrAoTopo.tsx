import { useEffect } from "react";
import { useLocation } from "react-router";

/**
 * Leva a página ao topo a cada troca de rota.
 *
 * Num site de várias páginas o navegador faz isso sozinho, mas aqui a
 * navegação acontece sem recarregar: o React troca o conteúdo e o scroll fica
 * onde estava. Quem clicava em "Histórias" no rodapé, lá embaixo, abria a
 * página nova já no fim dela.
 *
 * Dois detalhes que fazem funcionar de verdade:
 *
 * O Lenis rola por `transform`, não por `scrollTop`. Chamar só
 * `window.scrollTo` deixaria a posição interna dele desatualizada, e o
 * primeiro gesto de rolagem daria um salto de volta. Por isso ele é avisado
 * primeiro, com `immediate` — animar a subida seria mostrar uma página que a
 * pessoa nem viu.
 *
 * Âncoras (#duvidas, #comecar) são respeitadas: se a URL aponta para um ponto
 * da página, subir ao topo desfaria exatamente o que o link pediu.
 */
export function IrAoTopo() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;

    window.__lenis?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
