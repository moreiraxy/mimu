"use client";

import { useEffect, useState } from "react";
import { TrendingDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/PageHeader";
import { paraISOLocal } from "@/lib/utils";
import { executarComSuporteOffline } from "@/lib/offline/sync";
import { consumirCorrecaoMimu } from "@/lib/mimu-correcao";
import { primeiroErroZod, schemaTransacao } from "@/lib/validacao/negocio";
import { TransacaoForm, type DadosFormularioTransacao } from "../TransacaoForm";
import { RegistroConcluido } from "../RegistroConcluido";

export default function NovaSaidaPage() {
  const { empresa } = useEmpresa();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [concluido, setConcluido] = useState(false);
  const [concluidoOffline, setConcluidoOffline] = useState(false);
  const [chaveFormulario, setChaveFormulario] = useState(0);

  // Prefill vindo do "Corrigir" do chat da Mimu — via sessionStorage, nunca
  // query string, pra valor/cliente não ficarem expostos na URL.
  const [valoresIniciais, setValoresIniciais] =
    useState<Partial<DadosFormularioTransacao>>();
  const [prefillPronto, setPrefillPronto] = useState(false);

  useEffect(() => {
    const correcao = consumirCorrecaoMimu();
    if (correcao) {
      setValoresIniciais({
        valor: correcao.valor ? Number(correcao.valor) : undefined,
        descricao: correcao.descricao,
        cliente:
          correcao.clienteId && correcao.clienteNome
            ? { id: correcao.clienteId, nome: correcao.clienteNome }
            : undefined,
        data: correcao.data,
      });
    }
    setPrefillPronto(true);
  }, []);

  async function handleSubmit(dados: DadosFormularioTransacao) {
    if (!empresa) return;

    const validacao = schemaTransacao.safeParse({
      valor: dados.valor,
      descricao: dados.descricao,
      categoria: dados.categoria,
      data: dados.data,
    });
    if (!validacao.success) {
      setErro(primeiroErroZod(validacao.error));
      return;
    }

    setEnviando(true);
    setErro(null);

    const dataBase = new Date(`${dados.data}T00:00:00`);
    const grupoParcelamentoId =
      dados.parcelas > 1 ? crypto.randomUUID() : null;
    const valorParcela =
      Math.round((dados.valor / dados.parcelas) * 100) / 100;

    const linhas = Array.from({ length: dados.parcelas }, (_, i) => {
      const ehUltima = i === dados.parcelas - 1;
      const valor = ehUltima
        ? Number((dados.valor - valorParcela * (dados.parcelas - 1)).toFixed(2))
        : valorParcela;
      const dataParcela = new Date(
        dataBase.getFullYear(),
        dataBase.getMonth() + i,
        dataBase.getDate(),
      );

      return {
        empresa_id: empresa.id,
        tipo: "saida" as const,
        valor,
        descricao: dados.descricao || null,
        categoria: dados.categoria || null,
        cliente_id: dados.cliente?.id ?? null,
        forma_pagamento: dados.formaPagamento,
        data: paraISOLocal(dataParcela),
        parcelas: dados.parcelas,
        parcela_atual: i + 1,
        grupo_parcelamento_id: grupoParcelamentoId,
        status_pagamento: dados.contaPendente
          ? ("pendente" as const)
          : ("pago" as const),
        data_vencimento: dados.contaPendente ? dados.dataVencimento : null,
      };
    });

    const offline = typeof navigator !== "undefined" && !navigator.onLine;

    if (!offline) {
      const { error } = await supabase.from("transacoes").insert(linhas);
      setEnviando(false);

      if (error) {
        setErro("Não foi possível registrar. Tente de novo.");
        return;
      }
    } else {
      // Offline: cada parcela vira um item independente na fila (mesmo
      // efeito final do insert em lote, sem depender de uma única
      // transação de rede que não existe no momento).
      for (const linha of linhas) {
        const resultado = await executarComSuporteOffline(
          supabase,
          "transacoes",
          "insert",
          crypto.randomUUID(),
          linha,
        );
        if (resultado.error) {
          setEnviando(false);
          setErro("Não foi possível salvar. Tente de novo.");
          return;
        }
      }
      setEnviando(false);
    }

    showToast(
      offline ? "Saída salva — vai sincronizar depois." : "Saída registrada!",
      TrendingDown,
    );
    setConcluidoOffline(offline);
    setConcluido(true);
  }

  if (concluido) {
    return (
      <RegistroConcluido
        titulo="Saída registrada!"
        subtitulo={
          concluidoOffline
            ? "Você estava sem conexão — assim que voltar, ela sincroniza automaticamente."
            : undefined
        }
        onNovo={() => {
          setConcluido(false);
          setChaveFormulario((k) => k + 1);
        }}
      />
    );
  }

  return (
    <div className="lg:mx-auto lg:max-w-[560px]">
      <PageHeader title="Nova saída" />
      <TransacaoForm
        key={`${chaveFormulario}-${prefillPronto}`}
        tipo="saida"
        valoresIniciais={valoresIniciais}
        onSubmit={handleSubmit}
        enviando={enviando}
        erro={erro}
      />
    </div>
  );
}
