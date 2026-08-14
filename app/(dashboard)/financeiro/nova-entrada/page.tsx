"use client";

import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useToast } from "@/hooks/useToast";
import { useAlertasProativos } from "@/hooks/useAlertasProativos";
import { PageHeader } from "@/components/PageHeader";
import { executarComSuporteOffline } from "@/lib/offline/sync";
import { consumirCorrecaoMimu } from "@/lib/mimu-correcao";
import { primeiroErroZod, schemaTransacao } from "@/lib/validacao/negocio";
import { TransacaoForm, type DadosFormularioTransacao } from "../TransacaoForm";
import { RegistroConcluido } from "../RegistroConcluido";

export default function NovaEntradaPage() {
  const { empresa } = useEmpresa();
  const { showToast } = useToast();
  const { verificarAgora } = useAlertasProativos();
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

    const resultado = await executarComSuporteOffline(
      supabase,
      "transacoes",
      "insert",
      crypto.randomUUID(),
      {
        empresa_id: empresa.id,
        tipo: "entrada",
        valor: dados.valor,
        descricao: dados.descricao || null,
        categoria: dados.categoria || null,
        cliente_id: dados.cliente?.id ?? null,
        forma_pagamento: dados.formaPagamento,
        data: dados.data,
        parcelas: 1,
        parcela_atual: 1,
      },
    );

    setEnviando(false);

    if (resultado.error) {
      setErro("Não foi possível registrar. Tente de novo.");
      return;
    }

    showToast(
      resultado.offline ? "Entrada salva! Vai sincronizar depois." : "Entrada registrada!",
      DollarSign,
    );
    setConcluidoOffline(resultado.offline);
    setConcluido(true);
    if (!resultado.offline) {
      // Checa alertas na hora — é o gatilho do "recorde batido" (Comando 3).
      verificarAgora();
    }
  }

  if (concluido) {
    return (
      <RegistroConcluido
        titulo="Entrada registrada!"
        subtitulo={
          concluidoOffline
            ? "Você estava sem conexão. Assim que voltar, ela sincroniza automaticamente."
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
      <PageHeader title="Nova entrada" />
      <TransacaoForm
        key={`${chaveFormulario}-${prefillPronto}`}
        tipo="entrada"
        valoresIniciais={valoresIniciais}
        onSubmit={handleSubmit}
        enviando={enviando}
        erro={erro}
      />
    </div>
  );
}
