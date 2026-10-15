"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { usePosto } from "@/hooks/usePosto";
import { useAgendamentos } from "@/hooks/useAgendamentos";
import { useClientes } from "@/hooks/useClientes";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/PageHeader";
import { SeletorSegmentado } from "@/components/SeletorSegmentado";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDataComDiaSemana } from "@/lib/formatters";
import { dataDeHojeNoBrasil } from "@/lib/datas";
import { ehFimDeSemanaNoBrasil } from "@/lib/posto/rotina";
import { Widgets } from "./Widgets";
import { AgoraCard } from "./AgoraCard";
import { CompromissosCard } from "./CompromissosCard";
import { RotinaLista } from "./RotinaLista";
import { Pendencias } from "./Pendencias";
import { NumerosDoDia } from "./NumerosDoDia";
import { DinheiroCard } from "./DinheiroCard";
import { FrentesCard } from "./FrentesCard";
import { ResumoDoDia } from "./ResumoDoDia";

/**
 * O Posto de Comando.
 *
 * SEGUNDA VERSÃO, e o motivo está nas palavras dela sobre a primeira: "longa
 * demais, muito rolar", "texto demais", "feia, sem cara de painel", "tira tudo
 * que não faz parte do meu posto".
 *
 * O que mudou de estrutura:
 *
 * ABAS, E NÃO SETE SEÇÕES EMPILHADAS. Eram sete cartões um debaixo do outro, e
 * o que ela usa de minuto em minuto (o agora, o que está em aberto) dividia
 * rolagem com o que ela consulta uma vez por mês (os cinco cargos). Agora
 * "Hoje" cabe quase numa tela, e Dinheiro e Cargos são destinos.
 *
 * O CALENDÁRIO ENTROU. Hoje e amanhã, dentro de "Hoje", porque confirmar a
 * reunião da véspera é trabalho de hoje.
 *
 * O RESUMO NASCE FECHADO. Ele é das 17:45; aparecer aberto o dia inteiro é uma
 * caixa de texto vazia ocupando meia tela desde as 9:30.
 */

type Aba = "hoje" | "dinheiro" | "cargos";

const ABAS: { id: Aba; label: string }[] = [
  { id: "hoje", label: "Hoje" },
  { id: "dinheiro", label: "Dinheiro" },
  { id: "cargos", label: "Cargos" },
];

export default function PostoPage() {
  const {
    dados,
    loading,
    error,
    agora,
    marcarBloco,
    criarPendencia,
    fecharPendencia,
    anotarNumero,
    salvarResumo,
  } = usePosto();
  const { showToast } = useToast();
  const [aba, setAba] = useState<Aba>("hoje");
  const [verResumo, setVerResumo] = useState(false);

  /*
   * Hoje e amanhã numa busca só.
   *
   * O intervalo vai pelo dia de BRASÍLIA, não por `toISOString()`: às 21h o
   * servidor em UTC já está em amanhã, e a agenda mostraria o dia errado
   * justamente no fim do expediente.
   */
  const { hojeISO, amanhaISO } = useMemo(() => {
    const hoje = dataDeHojeNoBrasil(agora);
    const amanha = new Date(`${hoje}T12:00:00Z`);
    amanha.setUTCDate(amanha.getUTCDate() + 1);
    return { hojeISO: hoje, amanhaISO: dataDeHojeNoBrasil(amanha) };
  }, [agora]);

  const { agendamentos } = useAgendamentos(hojeISO, amanhaISO);
  // Os leads entram pelos widgets: "parados há 5 dias ou mais" é o estoque de
  // trabalho da ativação de base, e é o número que decide se aquele bloco de
  // duas horas e meia tem o que fazer.
  const { clientes: leads } = useClientes();
  const deHoje = agendamentos.filter((a) => a.data_hora.startsWith(hojeISO));
  const deAmanha = agendamentos.filter((a) => a.data_hora.startsWith(amanhaISO));

  if (loading) {
    return (
      <div className="lg:mx-auto lg:max-w-5xl">
        <PageHeader title="Posto" voltar={false} />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28 w-full rounded-[20px]" />
          <Skeleton className="h-40 w-full rounded-[20px]" />
          <Skeleton className="h-56 w-full rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:mx-auto lg:max-w-5xl">
        <PageHeader title="Posto" voltar={false} />
        <p className="vidro-card rounded-[20px] p-5 text-sm text-escuro">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="lg:mx-auto lg:max-w-5xl">
      <PageHeader title="Posto" voltar={false} />

      <p className="mb-3 text-[13px] text-neutro-muted">
        {formatDataComDiaSemana(agora)}
        {ehFimDeSemanaNoBrasil(agora) && " · fim de semana"}
      </p>

      <SeletorSegmentado
        opcoes={ABAS}
        valor={aba}
        onChange={setAba}
        className="mb-4"
      />

      {aba === "hoje" && (
        <div className="flex flex-col gap-4">
          {/* Os números de relance, antes de tudo. Tocar num deles rola até a
              seção que resolve aquele número — ou troca para a aba do
              dinheiro, no caso do último. */}
          <Widgets
            rotina={dados.rotina}
            pendencias={dados.pendencias}
            compromissosHoje={deHoje.map((a) => ({
              horario: new Date(a.data_hora).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
            }))}
            numeros={dados.numeros}
            dinheiro={dados.dinheiroDoMes}
            leads={leads}
            hoje={hojeISO}
            irPara={(id) =>
              document
                .getElementById(id)
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            irParaDinheiro={() => setAba("dinheiro")}
          />

          <AgoraCard
            rotina={dados.rotina}
            onMarcar={async (bloco) => {
              const ok = await marcarBloco(bloco, true);
              if (!ok) showToast("Não consegui marcar agora.");
            }}
          />

          <div id="aberto">
            <Pendencias
              pendencias={dados.pendencias}
              onCriar={async (nova) => {
                const ok = await criarPendencia(nova);
                showToast(ok ? "Anotado." : "Não consegui anotar.");
                return ok;
              }}
              onFechar={async (id) => {
                const ok = await fecharPendencia(id);
                if (!ok) showToast("Não consegui concluir.");
              }}
            />
          </div>

          <CompromissosCard hoje={deHoje} amanha={deAmanha} />

          <div id="rotina">
            <RotinaLista
              rotina={dados.rotina}
              onAlternar={async (bloco, feito) => {
                const ok = await marcarBloco(bloco, feito);
                if (!ok) showToast("Não consegui salvar.");
              }}
            />
          </div>

          <div id="numeros">
            <NumerosDoDia
              valores={dados.numeros}
              onAnotar={async (chave, valor) => {
                const ok = await anotarNumero(chave, valor);
                if (!ok) showToast("Não consegui anotar o número.");
              }}
            />
          </div>

          {/* Fechado até ela querer: é tarefa das 17:45. */}
          {verResumo || dados.resumoDoDia ? (
            <ResumoDoDia
              rotina={dados.rotina}
              numeros={dados.numeros}
              pendencias={dados.pendencias}
              dataTexto={formatDataComDiaSemana(agora)}
              salvo={dados.resumoDoDia}
              onSalvar={async (texto, enviado) => {
                const ok = await salvarResumo(texto, enviado);
                showToast(ok ? "Guardado." : "Não consegui guardar.");
                return ok;
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setVerResumo(true)}
              className="vidro-card flex items-center justify-between rounded-[20px] px-5 py-4 text-left"
            >
              <span className="text-[15px] font-bold text-escuro">
                Resumo para o Dyego
              </span>
              <ChevronDown className="size-4 text-neutro-muted" />
            </button>
          )}
        </div>
      )}

      {aba === "dinheiro" && <DinheiroCard resumo={dados.dinheiroDoMes} />}

      {aba === "cargos" && <FrentesCard pendencias={dados.pendencias} />}
    </div>
  );
}
