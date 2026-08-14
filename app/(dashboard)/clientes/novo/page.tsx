"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/PageHeader";
import { executarComSuporteOffline } from "@/lib/offline/sync";
import { primeiroErroZod, schemaCliente } from "@/lib/validacao/negocio";
import { ClienteForm, type DadosFormularioCliente } from "../ClienteForm";

export default function NovoClientePage() {
  const { empresa } = useEmpresa();
  const router = useRouter();
  const { showToast } = useToast();
  const [supabase] = useState(() => createClient());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(dados: DadosFormularioCliente) {
    if (!empresa) return;

    const validacao = schemaCliente.safeParse({
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email,
      saldoFiado: dados.saldoFiado,
    });
    if (!validacao.success) {
      setErro(primeiroErroZod(validacao.error));
      return;
    }

    setEnviando(true);
    setErro(null);

    const resultado = await executarComSuporteOffline(
      supabase,
      "clientes",
      "insert",
      crypto.randomUUID(),
      {
        empresa_id: empresa.id,
        nome: dados.nome,
        telefone: dados.telefone || null,
        email: dados.email || null,
        data_nascimento: dados.dataNascimento || null,
        observacoes: dados.observacoes || null,
        saldo_fiado: dados.saldoFiado,
      },
    );

    setEnviando(false);

    if (resultado.error) {
      setErro("Não foi possível salvar. Tente de novo.");
      return;
    }

    if (resultado.offline) {
      showToast("Cliente salvo! Vai sincronizar quando a conexão voltar.");
      router.push("/clientes");
      return;
    }

    showToast("Cliente cadastrado!");
    router.push(`/clientes/${resultado.id}`);
  }

  return (
    <div className="lg:mx-auto lg:max-w-[560px]">
      <PageHeader title="Novo cliente" />
      <ClienteForm onSubmit={handleSubmit} enviando={enviando} erro={erro} />
    </div>
  );
}
