"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useToast } from "@/hooks/useToast";
import { useVoltarAposCriar } from "@/hooks/useVoltarAposCriar";
import { PageHeader } from "@/components/PageHeader";
import { executarComSuporteOffline } from "@/lib/offline/sync";
import { consumirCorrecaoMimu, type CorrecaoMimu } from "@/lib/mimu-correcao";
import { primeiroErroZod, schemaAgendamento } from "@/lib/validacao/negocio";
import {
  AgendamentoForm,
  type DadosFormularioAgendamento,
} from "../AgendamentoForm";

// clienteId/clienteNome continuam vindo por query string — é o link "Agendar
// novamente" do perfil do cliente (app/(dashboard)/clientes/[id]), não tem
// valor financeiro nenhum ali. valor/descricao/data/horario, que vêm do
// "Corrigir" do chat da Mimu, chegam por sessionStorage (ver corrigirRegistro
// em app/(dashboard)/mimu/page.tsx) — nunca pela URL.
export default function NovoAgendamentoPage({
  searchParams,
}: {
  searchParams: { clienteId?: string; clienteNome?: string };
}) {
  const { empresa } = useEmpresa();
  const router = useRouter();
  const { showToast } = useToast();
  const voltar = useVoltarAposCriar("/agenda");
  const [supabase] = useState(() => createClient());
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [correcao, setCorrecao] = useState<CorrecaoMimu | null>(null);
  const [prefillPronto, setPrefillPronto] = useState(false);

  useEffect(() => {
    setCorrecao(consumirCorrecaoMimu());
    setPrefillPronto(true);
  }, []);

  async function handleSubmit(dados: DadosFormularioAgendamento) {
    if (!empresa) return;

    const validacao = schemaAgendamento.safeParse({
      titulo: dados.titulo,
      data: dados.data,
      horario: dados.horario,
    });
    if (!validacao.success) {
      setErro(primeiroErroZod(validacao.error));
      return;
    }

    setEnviando(true);
    setErro(null);

    const dataHora = new Date(`${dados.data}T${dados.horario}:00`);

    const resultado = await executarComSuporteOffline(
      supabase,
      "agendamentos",
      "insert",
      crypto.randomUUID(),
      {
        empresa_id: empresa.id,
        cliente_id: dados.cliente?.id ?? null,
        titulo: dados.titulo,
        descricao: dados.observacoes || null,
        valor_previsto: dados.valorPrevisto,
        data_hora: dataHora.toISOString(),
        duracao_minutos: dados.duracaoMinutos,
        status: dados.status,
      },
    );

    setEnviando(false);

    if (resultado.error) {
      setErro("Não foi possível salvar. Tente de novo.");
      return;
    }

    showToast(
      resultado.offline
        ? "Agendamento salvo! Vai sincronizar quando a conexão voltar."
        : "Agendamento criado!",
      Calendar,
    );
    voltar();
  }

  // O Next já decodifica os valores da query string automaticamente — nada
  // de decodeURIComponent aqui, senão dá double-decode.
  const clientePreSelecionado =
    searchParams.clienteId && searchParams.clienteNome
      ? { id: searchParams.clienteId, nome: searchParams.clienteNome }
      : correcao?.clienteId && correcao?.clienteNome
        ? { id: correcao.clienteId, nome: correcao.clienteNome }
        : undefined;

  const valoresIniciais: Partial<DadosFormularioAgendamento> | undefined =
    clientePreSelecionado ||
    correcao?.valor ||
    correcao?.descricao ||
    correcao?.data ||
    correcao?.horario
      ? {
          cliente: clientePreSelecionado,
          titulo: correcao?.descricao,
          valorPrevisto: correcao?.valor ? Number(correcao.valor) : undefined,
          data: correcao?.data,
          horario: correcao?.horario,
        }
      : undefined;

  return (
    <div className="lg:mx-auto lg:max-w-[560px]">
      <PageHeader title="Novo agendamento" />
      <AgendamentoForm
        key={prefillPronto ? "pronto" : "carregando"}
        valoresIniciais={valoresIniciais}
        onSubmit={handleSubmit}
        enviando={enviando}
        erro={erro}
      />
    </div>
  );
}
