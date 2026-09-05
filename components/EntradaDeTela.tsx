"use client";

import { usePathname } from "next/navigation";

/**
 * A tela que entra em vez de aparecer de repente.
 *
 * Sem isto, trocar de tela é um corte seco: o conteúdo antigo some e o novo
 * já está lá. Funciona, mas é o comportamento de um site — app nativo dá ao
 * olho um instante para acompanhar para onde a atenção foi.
 *
 * A CHAVE É O CAMINHO, e não é para forçar remontagem: trocar de rota já
 * remonta a página por conta do Next. A chave existe porque a animação de CSS
 * só recomeça se o elemento for novo — sem ela, a entrada tocaria uma vez, na
 * primeira abertura, e nunca mais.
 *
 * Fica DENTRO do container de conteúdo e FORA da barra de navegação, de
 * propósito: a barra não deve piscar a cada troca de tela, ela é o que fica
 * parado enquanto o resto muda. E porque ela é `vidro` — ver o comentário do
 * keyframe `entrar-tela` sobre o que uma animação faz com o `backdrop-filter`
 * de quem está abaixo.
 */
export function EntradaDeTela({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();

  return (
    <div
      key={caminho}
      className="animate-entrar-tela motion-reduce:animate-none"
    >
      {children}
    </div>
  );
}
