"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useToast } from "@/hooks/useToast";
import { useVoltarAposCriar } from "@/hooks/useVoltarAposCriar";
import { PageHeader } from "@/components/PageHeader";
import { ProdutoForm, type DadosFormularioProduto } from "../ProdutoForm";

export default function NovoProdutoPage() {
  const { empresa } = useEmpresa();
  const { showToast } = useToast();
  const voltar = useVoltarAposCriar("/produtos");
  const [supabase] = useState(() => createClient());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(dados: DadosFormularioProduto) {
    if (!empresa) return;
    setEnviando(true);
    setErro(null);

    const { error } = await supabase
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
      });

    setEnviando(false);

    if (error) {
      setErro("Não foi possível salvar. Tente de novo.");
      return;
    }

    showToast("Produto cadastrado!");
    /*
     * Volta para a lista, e não para a ficha do produto recém-criado.
     *
     * Ir para a ficha parece atencioso e não é: quem acabou de cadastrar já
     * sabe o que digitou, e o que ela quer ver é o produto na lista — ou
     * cadastrar o próximo. Abrindo a ficha, os dois caminhos custam um toque
     * a mais, e ela ainda fica presa numa tela nova sem ter pedido.
     *
     * É a mesma regra de venda, despesa, agendamento e cliente
     * (hooks/useVoltarAposCriar.ts).
     */
    voltar();
  }

  return (
    <div className="lg:mx-auto lg:max-w-[560px]">
      <PageHeader title="Novo produto" />
      <ProdutoForm onSubmit={handleSubmit} enviando={enviando} erro={erro} />
    </div>
  );
}
