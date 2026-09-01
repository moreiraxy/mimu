"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { limpaCache } from "@/lib/cache-de-tela";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProdutoForm, type DadosFormularioProduto } from "../ProdutoForm";
import type { Produto } from "@/types";

export default function EditarProdutoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());

  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(
    null,
  );
  const [enviando, setEnviando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setErroCarregamento(null);

    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      setErroCarregamento("Produto não encontrado.");
      setLoading(false);
      return;
    }

    setProduto(data);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function handleSubmit(dados: DadosFormularioProduto) {
    if (!produto) return;
    setEnviando(true);
    setErroFormulario(null);

    const { error } = await supabase
      .from("produtos")
      .update({
        nome: dados.nome,
        categoria: dados.categoria || null,
        preco_venda: dados.precoVenda || null,
        preco_custo: dados.precoCusto || null,
        quantidade_estoque: dados.quantidadeEstoque,
        quantidade_minima: dados.quantidadeMinima,
        codigo_barras: dados.codigoBarras || null,
        ativo: dados.ativo,
      })
      .eq("id", produto.id);
    // O guardado das listas acabou de ficar velho — ver lib/cache-de-tela.ts.
    limpaCache();

    setEnviando(false);

    if (error) {
      setErroFormulario("Não foi possível salvar. Tente de novo.");
      return;
    }

    showToast("Produto atualizado.");
    router.push("/produtos");
  }

  if (loading) {
    return (
      <div className="lg:mx-auto lg:max-w-[560px]">
        <PageHeader title="Editar produto" />
        <Skeleton className="h-96 w-full rounded-card" />
      </div>
    );
  }

  if (erroCarregamento || !produto) {
    return (
      <div className="lg:mx-auto lg:max-w-[560px]">
        <PageHeader title="Editar produto" />
        <p className="mt-6 text-center text-sm text-neutro-muted">
          {erroCarregamento}
        </p>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:max-w-[560px]">
      <PageHeader title="Editar produto" />
      <ProdutoForm
        textoBotao="Salvar alterações"
        enviando={enviando}
        erro={erroFormulario}
        valoresIniciais={{
          nome: produto.nome,
          categoria: produto.categoria ?? "",
          precoVenda: Number(produto.preco_venda ?? 0),
          precoCusto: Number(produto.preco_custo ?? 0),
          quantidadeEstoque: produto.quantidade_estoque,
          quantidadeMinima: produto.quantidade_minima,
          codigoBarras: produto.codigo_barras ?? "",
          ativo: produto.ativo,
        }}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
