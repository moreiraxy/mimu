"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { ClienteSearchInput, type ClienteOpcao } from "@/components/ClienteSearchInput";
import { useCategorias } from "@/hooks/useCategorias";
import { FORMAS_PAGAMENTO } from "@/lib/formasPagamento";
import { formatCurrency } from "@/lib/formatters";
import { paraISOLocal } from "@/lib/utils";
import type { FormaPagamento, TipoTransacao } from "@/types";

export interface DadosFormularioTransacao {
  valor: number;
  descricao: string;
  categoria: string;
  cliente: ClienteOpcao | null;
  formaPagamento: FormaPagamento | null;
  data: string;
  parcelas: number;
  contaPendente: boolean;
  dataVencimento: string | null;
}

const OPCOES_PARCELAS = [2, 3, 6, 12];

function formatarCentavos(centavos: number) {
  return formatCurrency(centavos / 100);
}

export function TransacaoForm({
  tipo,
  valoresIniciais,
  podeParcelar = true,
  textoBotao = "Confirmar",
  enviando = false,
  erro,
  onSubmit,
}: {
  tipo: TipoTransacao;
  valoresIniciais?: Partial<DadosFormularioTransacao>;
  podeParcelar?: boolean;
  textoBotao?: string;
  enviando?: boolean;
  erro?: string | null;
  onSubmit: (dados: DadosFormularioTransacao) => void | Promise<void>;
}) {
  const { empresa } = useEmpresa();
  const [supabase] = useState(() => createClient());

  const [centavos, setCentavos] = useState(
    valoresIniciais?.valor ? Math.round(valoresIniciais.valor * 100) : 0,
  );
  const [descricao, setDescricao] = useState(
    valoresIniciais?.descricao ?? "",
  );
  const [categoria, setCategoria] = useState(valoresIniciais?.categoria ?? "");
  const [cliente, setCliente] = useState<ClienteOpcao | null>(
    valoresIniciais?.cliente ?? null,
  );
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento | null>(
    valoresIniciais?.formaPagamento ?? null,
  );
  const [data, setData] = useState(
    valoresIniciais?.data ?? paraISOLocal(new Date()),
  );
  const [parcelado, setParcelado] = useState((valoresIniciais?.parcelas ?? 1) > 1);
  const [parcelas, setParcelas] = useState(valoresIniciais?.parcelas ?? 2);
  const [contaPendente, setContaPendente] = useState(
    valoresIniciais?.contaPendente ?? false,
  );
  const [dataVencimento, setDataVencimento] = useState(
    valoresIniciais?.dataVencimento ?? "",
  );
  const [sugestoes, setSugestoes] = useState<string[]>([]);

  const { categorias } = useCategorias(tipo);
  const mostrarParcelamento = tipo === "saida" && podeParcelar;
  const mostrarContaPendente = tipo === "saida";
  const valor = centavos / 100;

  useEffect(() => {
    if (!empresa) return;
    supabase
      .from("transacoes")
      .select("descricao")
      .eq("empresa_id", empresa.id)
      .eq("tipo", tipo)
      .not("descricao", "is", null)
      .order("created_at", { ascending: false })
      .limit(30)
      .then(({ data: linhas }) => {
        const unicas = Array.from(
          new Set(
            (linhas ?? []).map((l) => l.descricao).filter(Boolean) as string[],
          ),
        );
        setSugestoes(unicas.slice(0, 8));
      });
  }, [empresa, supabase, tipo]);

  function handleDigitarValor(event: ChangeEvent<HTMLInputElement>) {
    const somenteDigitos = event.target.value.replace(/\D/g, "");
    setCentavos(somenteDigitos ? Number(somenteDigitos) : 0);
  }

  const pendenteAtiva = mostrarContaPendente && contaPendente;
  const podeConfirmar =
    valor > 0 &&
    categoria !== "" &&
    !enviando &&
    (!pendenteAtiva || dataVencimento !== "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!podeConfirmar) return;

    onSubmit({
      valor,
      descricao: descricao.trim(),
      categoria,
      cliente,
      formaPagamento,
      data,
      parcelas: mostrarParcelamento && parcelado ? parcelas : 1,
      contaPendente: pendenteAtiva,
      dataVencimento: pendenteAtiva ? dataVencimento : null,
    });
  }

  const valorParcela = parcelas > 0 ? valor / parcelas : 0;
  const dataBase = new Date(`${data}T00:00:00`);
  const proximaParcela = new Date(
    dataBase.getFullYear(),
    dataBase.getMonth() + 1,
    dataBase.getDate(),
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col items-center">
        <input
          type="text"
          inputMode="numeric"
          value={formatarCentavos(centavos)}
          onChange={handleDigitarValor}
          aria-label="Valor"
          className="w-full max-w-[280px] rounded-button border border-neutro-border bg-superficie px-4 py-4 text-center text-3xl font-semibold text-coral outline-none focus:border-coral"
        />
      </div>

      <div>
        <Input
          label="Descrição"
          placeholder="Ex.: Corte + escova"
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          list="sugestoes-descricao"
        />
        {sugestoes.length > 0 && (
          <datalist id="sugestoes-descricao">
            {sugestoes.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-neutro-muted">
          Categoria
        </p>
        <div className="flex flex-wrap gap-2">
          {categorias.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              onClick={() => setCategoria(opcao.nome)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                categoria === opcao.nome
                  ? "border-coral bg-coral text-white"
                  : "border-neutro-border bg-superficie text-escuro"
              }`}
            >
              {opcao.nome}
            </button>
          ))}
        </div>
      </div>

      <ClienteSearchInput value={cliente} onChange={setCliente} />

      <div>
        <p className="mb-2 text-xs font-semibold text-neutro-muted">
          Forma de pagamento
        </p>
        <div className="flex flex-wrap gap-2">
          {FORMAS_PAGAMENTO.map((forma) => (
            <button
              key={forma.valor}
              type="button"
              onClick={() => setFormaPagamento(forma.valor)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                formaPagamento === forma.valor
                  ? "border-coral bg-coral text-white"
                  : "border-neutro-border bg-superficie text-escuro"
              }`}
            >
              {forma.label}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Data"
        type="date"
        value={data}
        onChange={(event) => setData(event.target.value)}
      />

      {mostrarContaPendente && (
        <div className="rounded-card border border-neutro-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-escuro">
              Esta conta ainda não foi paga
            </p>
            <Toggle
              checked={contaPendente}
              onChange={setContaPendente}
              label="Conta ainda não foi paga"
            />
          </div>

          {contaPendente && (
            <div className="mt-4">
              <Input
                label="Data de vencimento"
                type="date"
                value={dataVencimento}
                onChange={(event) => setDataVencimento(event.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {mostrarParcelamento && (
        <div className="rounded-card border border-neutro-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-escuro">Parcelar</p>
            <Toggle
              checked={parcelado}
              onChange={setParcelado}
              label="Parcelar"
            />
          </div>

          {parcelado && (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-xs font-semibold text-neutro-muted">
                Em quantas parcelas?
              </p>
              <div className="flex gap-2">
                {OPCOES_PARCELAS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setParcelas(n)}
                    className={`flex-1 rounded-button border py-2 text-sm font-semibold transition-colors ${
                      parcelas === n
                        ? "border-coral bg-coral text-white"
                        : "border-neutro-border bg-superficie text-escuro"
                    }`}
                  >
                    {n}x
                  </button>
                ))}
              </div>
              {valor > 0 && (
                <p className="text-xs text-neutro-muted">
                  {parcelas}x de {formatCurrency(valorParcela)} — próxima em{" "}
                  {String(proximaParcela.getDate()).padStart(2, "0")}/
                  {String(proximaParcela.getMonth() + 1).padStart(2, "0")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {erro && (
        <p className="rounded-button bg-erro-light px-3 py-2 text-sm text-erro">
          {erro}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={!podeConfirmar}>
        {enviando ? "Salvando..." : textoBotao}
      </Button>
    </form>
  );
}
