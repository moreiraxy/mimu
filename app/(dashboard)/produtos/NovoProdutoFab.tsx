import Link from "next/link";
import { Plus } from "lucide-react";

/** FAB local da lista de produtos — o Fab global não conhece módulos opcionais como Produtos. */
export function NovoProdutoFab() {
  return (
    <Link
      href="/produtos/novo"
      aria-label="Novo produto"
      className="fixed bottom-[calc(64px+env(safe-area-inset-bottom)+28px)] right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-text shadow-lg md:bottom-8 md:right-8"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </Link>
  );
}
