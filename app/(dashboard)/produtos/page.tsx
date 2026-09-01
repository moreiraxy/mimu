"use client";

import { useMemo, useState } from "react";
import { useProdutos } from "@/hooks/useProdutos";
import { Skeleton } from "@/components/ui/Skeleton";
import { SearchIcon } from "@/components/icons/NavIcons";
import { produtoAbaixoDoMinimo } from "@/lib/calculations";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { ProdutoListItem } from "./ProdutoListItem";
import { NovoProdutoFab } from "./NovoProdutoFab";

const FILTROS = ["Todos", "Estoque baixo", "Inativos"] as const;
type Filtro = (typeof FILTROS)[number];

export default function ProdutosPage() {
  const { produtos, loading, error, refetch } = useProdutos();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("Todos");

  const filtrados = useMemo(() => {
    let resultado = produtos;

    if (filtro === "Estoque baixo") {
      resultado = resultado.filter(produtoAbaixoDoMinimo);
    } else if (filtro === "Inativos") {
      resultado = resultado.filter((p) => !p.ativo);
    } else {
      resultado = resultado.filter((p) => p.ativo);
    }

    const termo = busca.trim().toLowerCase();
    if (termo) {
      resultado = resultado.filter((p) => p.nome.toLowerCase().includes(termo));
    }

    return resultado;
  }, [produtos, filtro, busca]);

  if (loading) {
    return (
      <div className="lg:mx-auto lg:max-w-5xl">
        <PageHeader title="Produtos" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full rounded-card" />
          <Skeleton className="h-16 w-full rounded-card" />
          <Skeleton className="h-16 w-full rounded-card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:mx-auto lg:max-w-5xl">
        <PageHeader title="Produtos" />
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center">
          <p className="text-sm text-neutro-muted">{error}</p>
          <button
            type="button"
            onClick={refetch}
            className="text-[15px] font-bold text-primary-forte"
          >
            Tentar de novo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:max-w-5xl">
      {/* SEM <FadeIn> AQUI: a transição de opacidade faz do elemento um
          "backdrop root" enquanto roda, e todo o vidro de dentro perde o
          desfoque por 150ms a cada navegação — a tela entra chapada e só
          então vira vidro. É o mesmo motivo comentado em dashboard/page.tsx. */}
      <PageHeader title="Produtos" />

      <div className="flex items-center gap-2 vidro-card rounded-button px-3.5 py-2.5">
        <SearchIcon size={18} className="flex-shrink-0 text-neutro-muted" />
        <input
          type="text"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar por nome"
          className="w-full bg-transparent text-base text-escuro outline-none placeholder:text-neutro-muted md:text-sm"
        />
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto scroll-fade-x">
        {FILTROS.map((opcao) => (
          <button
            key={opcao}
            type="button"
            onClick={() => setFiltro(opcao)}
            className={cn(
              "flex-shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
              filtro === opcao
                ? "bg-primary/20 text-primary-forte"
                : "vidro-card text-escuro",
            )}
          >
            {opcao}
          </button>
        ))}
      </div>

      {/* Duas colunas a partir de 1280: produto é linha curta (nome, preço,
          estoque) e em coluna única sobra um vão enorme no meio de cada uma. */}
      <div className="mt-4 flex flex-col gap-2 xl:grid xl:grid-cols-2 xl:gap-3">
        {filtrados.length === 0 ? (
          <p className="py-10 text-center text-[15px] text-neutro-muted">
            {produtos.length === 0
              ? "Nenhum produto cadastrado ainda."
              : "Nenhum produto encontrado."}
          </p>
        ) : (
          filtrados.map((produto) => (
            <ProdutoListItem key={produto.id} produto={produto} />
          ))
        )}
      </div>

      <NovoProdutoFab />
    </div>
  );
}
