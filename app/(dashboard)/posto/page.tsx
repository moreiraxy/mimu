"use client";

import { usePosto } from "@/hooks/usePosto";
import { useToast } from "@/hooks/useToast";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDataComDiaSemana } from "@/lib/formatters";
import { ehFimDeSemanaNoBrasil } from "@/lib/posto/rotina";
import { AgoraCard } from "./AgoraCard";
import { RotinaLista } from "./RotinaLista";
import { Pendencias } from "./Pendencias";
import { NumerosDoDia } from "./NumerosDoDia";
import { DinheiroCard } from "./DinheiroCard";
import { FrentesCard } from "./FrentesCard";
import { ResumoDoDia } from "./ResumoDoDia";

/**
 * O Posto de Comando.
 *
 * A Mimu era um caixa de salão e ninguém assinou. O que existe de verdade é
 * uma pessoa com cinco frentes — sócia do produto, sócia comercial, assistente
 * da gerência de vendas, marca Fortis 360 e o suporte diário de 44 pessoas e
 * 33 números —, e três delas não estão em documento nenhum. Esta tela existe
 * para ela não precisar carregar tudo isso de cabeça.
 *
 * A ORDEM DAS SEÇÕES É A ORDEM DA URGÊNCIA, e não a ordem do documento:
 *
 *   1. Agora          — o que fazer neste minuto, e o que já passou da hora
 *   2. Em aberto      — a memória: cobrança, espera, aprovação do gerente
 *   3. Rotina         — os dez blocos, para marcar
 *   4. Números        — os seis indicadores do cargo que é medido
 *   5. Dinheiro       — o mês dela por fonte e por destino
 *   6. Resumo         — o texto das 17:45 montado
 *   7. Cargos         — a consulta de fundo: o que é meu, o que é do Dyego
 *
 * Por que "em aberto" vem ANTES da rotina: a rotina é previsível e está sempre
 * no mesmo lugar; o que ela esquece é o que alguém pediu no meio de um disparo.
 */
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

  if (loading) {
    return (
      <div className="lg:mx-auto lg:max-w-5xl">
        <PageHeader title="Posto de comando" voltar={false} />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-44 w-full rounded-[20px]" />
          <Skeleton className="h-36 w-full rounded-[20px]" />
          <Skeleton className="h-72 w-full rounded-[20px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lg:mx-auto lg:max-w-5xl">
        <PageHeader title="Posto de comando" voltar={false} />
        <p className="vidro-card rounded-[20px] p-5 text-sm text-escuro">
          {error}
        </p>
      </div>
    );
  }

  const fimDeSemana = ehFimDeSemanaNoBrasil(agora);

  return (
    <div className="lg:mx-auto lg:max-w-5xl">
      <PageHeader title="Posto de comando" voltar={false} />

      <p className="mb-4 text-[13px] text-neutro-muted">
        {formatDataComDiaSemana(agora)}
        {/* Sábado e domingo são "de casa, quando houver necessidade" — a tela
            diz isso em vez de cobrar a rotina de um dia que não é de trabalho. */}
        {fimDeSemana && " · fim de semana: só se houver necessidade"}
      </p>

      <div className="flex flex-col gap-4">
        <AgoraCard
          rotina={dados.rotina}
          onMarcar={async (bloco) => {
            const ok = await marcarBloco(bloco, true);
            if (!ok) showToast("Não consegui marcar agora.");
          }}
        />

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

        <RotinaLista
          rotina={dados.rotina}
          onAlternar={async (bloco, feito) => {
            const ok = await marcarBloco(bloco, feito);
            if (!ok) showToast("Não consegui salvar.");
          }}
        />

        <NumerosDoDia
          valores={dados.numeros}
          onAnotar={async (chave, valor) => {
            const ok = await anotarNumero(chave, valor);
            if (!ok) showToast("Não consegui anotar o número.");
          }}
        />

        <DinheiroCard resumo={dados.dinheiroDoMes} />

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

        <FrentesCard pendencias={dados.pendencias} />
      </div>
    </div>
  );
}
