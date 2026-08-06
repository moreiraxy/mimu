import Link from "next/link";
import { AlertTriangle, Package } from "lucide-react";
import { produtoAbaixoDoMinimo } from "@/lib/calculations";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { Produto } from "@/types";

export function ProdutoListItem({ produto }: { produto: Produto }) {
  const estoqueBaixo = produtoAbaixoDoMinimo(produto);

  return (
    <Link
      href={`/produtos/${produto.id}`}
      className={cn(
        "flex items-center gap-3 rounded-card border p-3",
        produto.ativo
          ? "border-neutro-border bg-superficie"
          : "border-neutro-border bg-fundo opacity-70",
      )}
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-coral-light text-coral">
        <Package className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-escuro">
          {produto.nome}
        </p>
        <p className="text-xs text-neutro-muted">
          {produto.categoria || "Sem categoria"}
          {!produto.ativo && " · Inativo"}
        </p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-1">
        {produto.preco_venda !== null && (
          <p className="text-sm font-semibold text-escuro">
            {formatCurrency(Number(produto.preco_venda))}
          </p>
        )}
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            estoqueBaixo
              ? "bg-erro-light text-erro"
              : "bg-fundo text-neutro-muted-strong",
          )}
        >
          {estoqueBaixo && <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2.5} />}
          {produto.quantidade_estoque} un.
        </span>
      </div>
    </Link>
  );
}
