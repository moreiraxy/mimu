"use client";

import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Minus,
  Plus,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { ModuloAtivo } from "@/types";
import { useDashboard } from "@/hooks/useDashboard";
import { useAlertasProativos } from "@/hooks/useAlertasProativos";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSeguraAbertura } from "@/components/TelaAbertura";
import { CartaoDado } from "@/components/CartaoDado";
import { Anel } from "@/components/graficos/Anel";
import { cn } from "@/lib/utils";
import {
  calcularProgressoMeta,
  calcularStatusNegocio,
} from "@/lib/calculations";
import {
  formatDataComDiaSemana,
  saudacaoPorHorario,
} from "@/lib/formatters";
import { HeroHome } from "./HeroHome";
import { CartaoDeHoje } from "./CartaoDeHoje";
import { AgendaHojeCard } from "./AgendaHojeCard";
import { AlertasCard } from "./AlertasCard";
import { CartaoResumoFaturamento } from "./CartaoResumoFaturamento";
import { CartaoMensagensMimu } from "./CartaoMensagensMimu";
import { PainelDeWidgets } from "./PainelDeWidgets";

/**
 * Os atalhos do topo do painel.
 *
 * "Chat" saiu daqui. A Mimu ganhou uma porta fixa — o botão da marca no canto
 * da barra de baixo, presente em toda tela — e o painel chegou a ter TRÊS
 * caminhos para o mesmo chat ao mesmo tempo: a marca no cabeçalho, este
 * atalho e o botão da barra. Três portas para a mesma sala não é conveniência,
 * é a pessoa achando que são coisas diferentes.
 *
 * `modulo` entrou porque a lista era fixa. Uma conta gratuita não tem agenda,
 * e mesmo assim via "Agendamento" aqui: tocar levava a uma rota que o
 * middleware devolve para o painel, sem explicar nada. Atalho que não leva a
 * lugar nenhum é pior que atalho ausente.
 */
const ACOES_RAPIDAS = [
  { label: "Nova venda", icone: Plus, href: "/financeiro/nova-entrada", modulo: "financeiro" },
  { label: "Nova despesa", icone: Minus, href: "/financeiro/nova-saida", modulo: "financeiro" },
  { label: "Agendamento", icone: Calendar, href: "/agenda/novo", modulo: "agenda" },
  { label: "Novo cliente", icone: UserPlus, href: "/clientes/novo", modulo: "clientes" },
] as const;

// Auth e onboarding já são garantidos pelo layout do grupo (dashboard).
export default function DashboardPage() {
  const { user, empresa, modulos, plano, loading: carregandoAuth } = useAuth();
  const {
    dados,
    loading: carregandoDashboard,
    error,
    refetch,
  } = useDashboard();
  const { alertas, dispensar } = useAlertasProativos();

  // Segura a tela de abertura até os números do painel chegarem: é o painel a
  // primeira tela de toda abertura, e é ele que define "o app carregou".
  useSeguraAbertura(carregandoAuth || carregandoDashboard || !dados);

  if (carregandoAuth || carregandoDashboard || !dados) {
    /*
     * O esqueleto continua existindo para as VOLTAS a esta tela; na primeira
     * abertura quem está por cima dele é a marca — ver `useSeguraAbertura`
     * logo acima e components/TelaAbertura.tsx.
     */
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-neutro-muted">{error}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="text-sm font-semibold text-primary-forte"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  const primeiroNome =
    (user?.user_metadata?.nome_completo as string | undefined)?.split(" ")[0] ??
    "por aqui";
  const metaDiaria = empresa?.meta_diaria ?? 0;
  const progressoDiario = calcularProgressoMeta(
    dados.faturamentoHoje,
    metaDiaria,
  );
  const statusDiario = calcularStatusNegocio(progressoDiario);

  const atalhos = ACOES_RAPIDAS.filter((acao) => modulos.includes(acao.modulo as ModuloAtivo));

  const primeiroAcesso =
    dados.faturamentoHoje === 0 &&
    dados.faturamentoMes === 0 &&
    dados.agendamentosHoje.length === 0 &&
    dados.totalAReceber === 0 &&
    dados.totalAPagar === 0;

  return (
    /*
      SEM <FadeIn> AQUI, e o motivo é técnico.

      Ele envolvia o painel inteiro com uma transição de `opacity`. Enquanto a
      opacidade é menor que 1, o elemento vira um "backdrop root": tudo que
      está dentro passa a capturar apenas o que existe DENTRO dele, e todo
      `backdrop-filter` abaixo — ou seja, o material de todos os widgets —
      achata de uma vez. O fundo deixa de atravessar os cards, que é o efeito
      inteiro.

      A entrada da tela não se perdeu: quem cobre esse momento é a tela de
      abertura com a marca, que já espera os dados chegarem.
    */
    <div className="flex flex-col gap-5 lg:mx-auto lg:max-w-6xl lg:gap-6">
      <HeroHome
        nome={empresa?.nome ?? "Mimu"}
        primeiroNome={primeiroNome}
        plano={plano}
        atalhos={atalhos}
      />

      {primeiroAcesso ? (
        /* Também sai do néon chapado: um cartão de vidro com a marca em traço
           fino, na mesma linguagem do resto. */
        <div className="vidro-card rounded-[20px] p-5">
          <p className="text-sm leading-relaxed text-escuro">
            Bem-vinda, {primeiroNome}! Registre sua primeira venda para a Mimu
            começar a acompanhar seu negócio.
          </p>
          <Link
            href="/financeiro/nova-entrada"
            className="mt-4 inline-flex items-center justify-center rounded-button bg-primary px-4 py-2.5 text-sm font-bold text-primary-text"
          >
            Registrar primeira venda
          </Link>
        </div>
      ) : (
        /*
          O painel deixou de ser uma lista fixa de cartões.
          Cada pessoa monta o seu: segurar um widget abre o menu (tamanho,
          remover, editar), e no modo de edição dá para acrescentar, tirar e
          reordenar. Ver lib/widgets.ts.
        */
        <PainelDeWidgets
          modulos={modulos}
          conteudo={(id, tamanho) => {
            switch (id) {
              case "hoje":
                return (
                  <CartaoDeHoje
                    status={statusDiario}
                    realizado={dados.faturamentoHoje}
                    previsto={dados.faturamentoPrevisto}
                    meta={metaDiaria}
                    progresso={progressoDiario}
                    tamanho={tamanho === "grande" ? "grande" : "medio"}
                  />
                );
              case "a-receber":
                return (
                  <CartaoDado
                    /*
                      O anel mostra quanto do que está em aberto já é "a
                      receber" — é a mesma leitura do "Limite disponível" da
                      referência: um número sozinho não diz se é muito ou
                      pouco, e a proporção diz.
                    */
                    grafico={
                      <Anel
                        progresso={
                          dados.totalAReceber + dados.totalAPagar > 0
                            ? (dados.totalAReceber /
                                (dados.totalAReceber + dados.totalAPagar)) *
                              100
                            : 0
                        }
                        cor="rgb(var(--verde-texto))"
                      />
                    }
                    /*
                     * O NÚMERO NÃO É COLORIDO — quem carrega a cor é o anel.
                     *
                     * "A receber" saía em verde-água e "A pagar" em laranja:
                     * dois tons que não existem em nenhuma outra parte do app,
                     * lado a lado, no meio de uma tela onde todo valor é
                     * branco. Pintar o anel E o número diz a mesma coisa duas
                     * vezes e gasta as duas únicas cores fortes da home com
                     * uma informação que o rótulo já dá.
                     */
                    rotulo="A receber"
                    valor={dados.totalAReceber}
                    href="/financeiro"
                  />
                );
              case "a-pagar":
                return (
                  <CartaoDado
                    grafico={
                      <Anel
                        progresso={
                          dados.totalAReceber + dados.totalAPagar > 0
                            ? (dados.totalAPagar /
                                (dados.totalAReceber + dados.totalAPagar)) *
                              100
                            : 0
                        }
                        cor="rgb(var(--ambar-texto))"
                      />
                    }
                    rotulo="A pagar"
                    valor={dados.totalAPagar}
                    href="/financeiro"
                  />
                );
              case "faturamento":
                return <CartaoResumoFaturamento alto={tamanho === "grande"} />;
              case "agenda":
                return <AgendaHojeCard agendamentos={dados.agendamentosHoje} />;
              case "alertas":
                return <AlertasCard alertas={alertas} onDispensar={dispensar} />;
              case "mimu":
                return <CartaoMensagensMimu />;
              default:
                return null;
            }
          }}
        />
      )}

    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5 lg:mx-auto lg:max-w-6xl lg:gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-9 w-9 rounded-2xl" />
      </div>
      <div className="grid grid-cols-4 gap-2 lg:gap-3">
        <Skeleton className="h-[74px] rounded-card" />
        <Skeleton className="h-[74px] rounded-card" />
        <Skeleton className="h-[74px] rounded-card" />
        <Skeleton className="h-[74px] rounded-card" />
      </div>
      <Skeleton className="h-32 w-full rounded-[20px]" />
      <div className="grid grid-cols-2 gap-3 lg:max-w-md">
        <Skeleton className="h-16 rounded-card" />
        <Skeleton className="h-16 rounded-card" />
      </div>
      <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2 lg:gap-6">
        <Skeleton className="h-32 w-full rounded-card" />
        <Skeleton className="h-32 w-full rounded-card" />
      </div>
      <Skeleton className="h-24 w-full rounded-card" />
    </div>
  );
}
