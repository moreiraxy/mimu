"use client";

import { useEffect, useState } from "react";
import { DollarSign } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useToast } from "@/hooks/useToast";
import { useVoltarAposCriar } from "@/hooks/useVoltarAposCriar";
import { useAlertasProativos } from "@/hooks/useAlertasProativos";
import { PageHeader } from "@/components/PageHeader";
import { executarComSuporteOffline } from "@/lib/offline/sync";
import { consumirCorrecaoMimu } from "@/lib/mimu-correcao";
import { primeiroErroZod, schemaTransacao } from "@/lib/validacao/negocio";
import { TransacaoForm, type DadosFormularioTransacao } from "../TransacaoForm";

export default function NovaEntradaPage() {
  const { empresa } = useEmpresa();
  const { showToast } = useToast();
  const voltar = useVoltarAposCriar("/financeiro");
  const { verificarAgora } = useAlertasProativos();
  const [supabase] = useState(() => createClient());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
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
    /*
     * Volta para onde a pessoa estava, em vez de parar numa tela de "pronto!".
     *
     * Havia aqui um <RegistroConcluido> com dois botões — "Registrar outro" e
     * "Voltar para o financeiro" — e ele obrigava um toque a mais depois de um
     * trabalho que já tinha terminado. Quem registra venda no balcão faz isso
     * com o cliente esperando; a confirmação cabe no aviso que sobe, e o
     * caminho de registrar outra é o "+" da barra, a um toque.
     */
    voltar();
    if (!resultado.offline) {
      // Checa alertas na hora — é o gatilho do "recorde batido" (Comando 3).
      verificarAgora();
    }
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
