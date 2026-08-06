"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/PageHeader";
import { ProdutoForm, type DadosFormularioProduto } from "../ProdutoForm";

export default function NovoProdutoPage() {
  const { empresa } = useEmpresa();
  const router = useRouter();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(dados: DadosFormularioProduto) {
    if (!empresa) return;
    setEnviando(true);
    setErro(null);

    const { data, error } = await supabase
      .from("produtos")
      .insert({
        empresa_id: empresa.id,
        nome: dados.nome,
        categoria: dados.categoria || null,
        preco_venda: dados.precoVenda || null,
        preco_custo: dados.precoCusto || null,
        quantidade_estoque: dados.quantidadeEstoque,
        quantidade_minima: dados.quantidadeMinima,
        codigo_barras: dados.codigoBarras || null,
        ativo: dados.ativo,
      })
      .select("id")
      .single();

    setEnviando(false);

    if (error || !data) {
      setErro("Não foi possível salvar. Tente de novo.");
      return;
    }

    showToast("Produto cadastrado!");
    router.push(`/produtos/${data.id}`);
  }

  return (
    <div className="lg:mx-auto lg:max-w-[560px]">
      <PageHeader title="Novo produto" />
      <ProdutoForm onSubmit={handleSubmit} enviando={enviando} erro={erro} />
    </div>
  );
}
