"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ShoppingBag, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useFornecedores } from "@/hooks/useFornecedores";
import { useProdutos } from "@/hooks/useProdutos";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/lib/formatters";

interface ItemCompra {
  produtoId: string;
  nome: string;
  quantidade: number;
  precoUnitario: number;
}

function centavosParaReais(centavos: number) {
  return formatCurrency(centavos / 100);
}

export default function ComprasPage({
  searchParams,
}: {
  searchParams: { fornecedorId?: string };
}) {
  const { empresa } = useEmpresa();
  const { fornecedores, loading: carregandoFornecedores } = useFornecedores();
  const { produtos, loading: carregandoProdutos } = useProdutos();
  const { showToast } = useToast();
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  const produtosAtivos = useMemo(() => produtos.filter((p) => p.ativo), [produtos]);

  const [fornecedorId, setFornecedorId] = useState(searchParams.fornecedorId ?? "");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<ItemCompra[]>([]);

  const [produtoSelecionado, setProdutoSelecionado] = useState("");
  const [quantidadeItem, setQuantidadeItem] = useState("1");
  const [centavosItem, setCentavosItem] = useState(0);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const total = itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0);

  function handleSelecionarProduto(id: string) {
    setProdutoSelecionado(id);
    const produto = produtosAtivos.find((p) => p.id === id);
    setCentavosItem(produto?.preco_custo ? Math.round(Number(produto.preco_custo) * 100) : 0);
  }

  function handleAdicionarItem() {
    const produto = produtosAtivos.find((p) => p.id === produtoSelecionado);
    const quantidade = Number(quantidadeItem);
    if (!produto || quantidade <= 0) return;

    setItens((atual) => [
      ...atual,
      {
        produtoId: produto.id,
        nome: produto.nome,
        quantidade,
        precoUnitario: centavosItem / 100,
      },
    ]);
    setProdutoSelecionado("");
    setQuantidadeItem("1");
    setCentavosItem(0);
  }

  function handleRemoverItem(index: number) {
    setItens((atual) => atual.filter((_, i) => i !== index));
  }

  async function handleSalvar() {
    if (!empresa || itens.length === 0) return;
    setSalvando(true);
    setErro(null);

    const { data: compra, error: erroCompra } = await supabase
      .from("compras")
      .insert({
        empresa_id: empresa.id,
        fornecedor_id: fornecedorId || null,
        valor_total: total,
        observacoes: observacoes.trim() || null,
      })
      .select("id")
      .single();

    if (erroCompra || !compra) {
      setSalvando(false);
      setErro("Não foi possível salvar a compra. Tente de novo.");
      return;
    }

    const { error: erroItens } = await supabase.from("compras_itens").insert(
      itens.map((item) => ({
        compra_id: compra.id,
        produto_id: item.produtoId,
        quantidade: item.quantidade,
        preco_unitario: item.precoUnitario,
      })),
    );

    setSalvando(false);

    if (erroItens) {
      setErro("Compra salva, mas não consegui registrar os itens.");
      return;
    }

    showToast("Compra registrada! Estoque atualizado.");
    router.push(fornecedorId ? `/fornecedores/${fornecedorId}` : "/estoque");
  }

  if (carregandoFornecedores || carregandoProdutos) {
    return (
      <div className="lg:mx-auto lg:max-w-2xl">
        <PageHeader title="Nova compra" />
        <Skeleton className="h-64 w-full rounded-card" />
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:max-w-2xl">
      <PageHeader title="Nova compra" />

      <div className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-neutro-muted">Fornecedor (opcional)</span>
          <select
            value={fornecedorId}
            onChange={(e) => setFornecedorId(e.target.value)}
            className="rounded-button border border-neutro-border bg-fundo px-3.5 py-3 text-base text-escuro outline-none focus:border-primary-forte md:text-sm"
          >
            <option value="">Sem fornecedor</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-card border border-neutro-border bg-superficie p-4">
          <p className="text-sm font-semibold text-escuro">Itens da compra</p>

          {produtosAtivos.length === 0 ? (
            <p className="mt-2 text-sm text-neutro-muted">
              Cadastre um produto antes de registrar uma compra.
            </p>
          ) : (
            <>
              <div className="mt-3 flex flex-col gap-3">
                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-neutro-muted">Produto</span>
                  <select
                    value={produtoSelecionado}
                    onChange={(e) => handleSelecionarProduto(e.target.value)}
                    className="rounded-button border border-neutro-border bg-fundo px-3.5 py-3 text-base text-escuro outline-none focus:border-primary-forte md:text-sm"
                  >
                    <option value="">Selecione um produto</option>
                    {produtosAtivos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Quantidade"
                    value={quantidadeItem}
                    onChange={(e) => setQuantidadeItem(e.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                  />
                  <Input
                    label="Preço unitário"
                    value={centavosParaReais(centavosItem)}
                    onChange={(e) => {
                      const digitos = e.target.value.replace(/\D/g, "");
                      setCentavosItem(digitos ? Number(digitos) : 0);
                    }}
                    inputMode="numeric"
                  />
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="flex items-center justify-center gap-2"
                  disabled={!produtoSelecionado || Number(quantidadeItem) <= 0}
                  onClick={handleAdicionarItem}
                >
                  <Plus className="h-4 w-4" strokeWidth={2.25} />
                  Adicionar item
                </Button>
              </div>

              {itens.length > 0 && (
                <div className="mt-4 flex flex-col divide-y divide-neutro-border border-t border-neutro-border">
                  {itens.map((item, index) => (
                    <div
                      key={`${item.produtoId}-${index}`}
                      className="flex items-center justify-between py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-escuro">{item.nome}</p>
                        <p className="text-xs text-neutro-muted">
                          {item.quantidade} × {formatCurrency(item.precoUnitario)}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <p className="text-sm font-semibold text-escuro">
                          {formatCurrency(item.quantidade * item.precoUnitario)}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRemoverItem(index)}
                          aria-label="Remover item"
                          className="text-neutro-muted hover:text-erro"
                        >
                          <Trash2 className="h-4 w-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-2.5">
                    <p className="text-sm font-semibold text-escuro">Total</p>
                    <p className="text-base font-semibold text-primary-forte">
                      {formatCurrency(total)}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <Textarea
          label="Observações (opcional)"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        {erro && (
          <p className="rounded-button bg-erro-light px-3 py-2 text-sm text-erro">{erro}</p>
        )}

        <Button
          className="flex w-full items-center justify-center gap-2"
          disabled={itens.length === 0 || salvando}
          onClick={handleSalvar}
        >
          <ShoppingBag className="h-4 w-4" strokeWidth={2.25} />
          {salvando ? "Salvando..." : "Registrar compra"}
        </Button>
      </div>
    </div>
  );
}
