import Link from "next/link";
import { Plus } from "lucide-react";

/**
 * FAB local da lista de produtos — o "+" da barra não conhece módulos
 * opcionais como Produtos.
 *
 * A ALTURA É MEDIDA NA BARRA, e não escolhida no olho. A barra flutua a
 * `safe-area + 16px` do fim da tela e tem, com a pílula "Pergunte à Mimu"
 * aberta em cima dela, cerca de 124px de altura — ou seja, o topo do conjunto
 * fica em `safe-area + 140px`. O botão estava em `safe-area + 116px`, dentro
 * dessa faixa: encostava na pílula sempre que ela estava aberta.
 *
 * 150px deixa ele logo acima do conjunto inteiro, com folga, em vez de acertar
 * só o estado recolhido da barra.
 */
export function NovoProdutoFab() {
  return (
    <Link
      href="/produtos/novo"
      aria-label="Novo produto"
      className="fixed bottom-[calc(env(safe-area-inset-bottom)+150px)] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-text shadow-lg md:bottom-8 md:right-8"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </Link>
  );
}
