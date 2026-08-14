"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { formatCurrency } from "@/lib/formatters";

export interface DadosFormularioProduto {
  nome: string;
  categoria: string;
  precoVenda: number;
  precoCusto: number;
  quantidadeEstoque: number;
  quantidadeMinima: number;
  codigoBarras: string;
  ativo: boolean;
}

function centavosParaReais(centavos: number) {
  return formatCurrency(centavos / 100);
}

export function ProdutoForm({
  valoresIniciais,
  textoBotao = "Salvar produto",
  enviando = false,
  erro,
  onSubmit,
}: {
  valoresIniciais?: Partial<DadosFormularioProduto>;
  textoBotao?: string;
  enviando?: boolean;
  erro?: string | null;
  onSubmit: (dados: DadosFormularioProduto) => void | Promise<void>;
}) {
  const [nome, setNome] = useState(valoresIniciais?.nome ?? "");
  const [categoria, setCategoria] = useState(valoresIniciais?.categoria ?? "");
  const [centavosVenda, setCentavosVenda] = useState(
    valoresIniciais?.precoVenda
      ? Math.round(valoresIniciais.precoVenda * 100)
      : 0,
  );
  const [centavosCusto, setCentavosCusto] = useState(
    valoresIniciais?.precoCusto
      ? Math.round(valoresIniciais.precoCusto * 100)
      : 0,
  );
  const [quantidadeEstoque, setQuantidadeEstoque] = useState(
    String(valoresIniciais?.quantidadeEstoque ?? 0),
  );
  const [quantidadeMinima, setQuantidadeMinima] = useState(
    String(valoresIniciais?.quantidadeMinima ?? 0),
  );
  const [codigoBarras, setCodigoBarras] = useState(
    valoresIniciais?.codigoBarras ?? "",
  );
  const [ativo, setAtivo] = useState(valoresIniciais?.ativo ?? true);

  const podeConfirmar = nome.trim() !== "" && !enviando;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!podeConfirmar) return;

    onSubmit({
      nome: nome.trim(),
      categoria: categoria.trim(),
      precoVenda: centavosVenda / 100,
      precoCusto: centavosCusto / 100,
      quantidadeEstoque: Math.max(0, Math.round(Number(quantidadeEstoque) || 0)),
      quantidadeMinima: Math.max(0, Math.round(Number(quantidadeMinima) || 0)),
      codigoBarras: codigoBarras.trim(),
      ativo,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        label="Nome"
        value={nome}
        onChange={(event) => setNome(event.target.value)}
        required
      />
      <Input
        label="Categoria (opcional)"
        value={categoria}
        onChange={(event) => setCategoria(event.target.value)}
        placeholder="Ex.: Bebidas, Cortes, Peças"
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Preço de venda"
          value={centavosParaReais(centavosVenda)}
          onChange={(event) => {
            const digitos = event.target.value.replace(/\D/g, "");
            setCentavosVenda(digitos ? Number(digitos) : 0);
          }}
          inputMode="numeric"
        />
        <Input
          label="Preço de custo"
          value={centavosParaReais(centavosCusto)}
          onChange={(event) => {
            const digitos = event.target.value.replace(/\D/g, "");
            setCentavosCusto(digitos ? Number(digitos) : 0);
          }}
          inputMode="numeric"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Quantidade atual"
          value={quantidadeEstoque}
          onChange={(event) =>
            setQuantidadeEstoque(event.target.value.replace(/\D/g, ""))
          }
          inputMode="numeric"
        />
        <Input
          label="Quantidade mínima"
          value={quantidadeMinima}
          onChange={(event) =>
            setQuantidadeMinima(event.target.value.replace(/\D/g, ""))
          }
          inputMode="numeric"
          helper="Abaixo disso, a Mimu avisa"
        />
      </div>

      <Input
        label="Código de barras (opcional)"
        value={codigoBarras}
        onChange={(event) => setCodigoBarras(event.target.value)}
        inputMode="numeric"
      />

      <div className="flex items-center justify-between rounded-button border border-neutro-border p-3.5">
        <div>
          <p className="text-sm font-semibold text-escuro">
            {ativo ? "Produto ativo" : "Produto inativo"}
          </p>
          <p className="text-xs text-neutro-muted">
            Produtos inativos somem da lista de vendas
          </p>
        </div>
        <Toggle checked={ativo} onChange={setAtivo} label="Produto ativo" />
      </div>

      {erro && (
        <p className="rounded-button bg-erro-light px-3 py-2 text-sm text-erro-texto">
          {erro}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={!podeConfirmar}>
        {enviando ? "Salvando..." : textoBotao}
      </Button>
    </form>
  );
}
