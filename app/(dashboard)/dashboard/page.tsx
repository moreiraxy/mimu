"use client";

import Link from "next/link";
import { Calendar, Hand, Minus, Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useDashboard } from "@/hooks/useDashboard";
import { useAlertasProativos } from "@/hooks/useAlertasProativos";
import { LogoMark } from "@/components/Logo";
import { Skeleton } from "@/components/ui/Skeleton";
import { FadeIn } from "@/components/ui/FadeIn";
import { cn } from "@/lib/utils";
import {
  calcularProgressoMeta,
  calcularStatusNegocio,
} from "@/lib/calculations";
import {
  formatCurrency,
  formatDataComDiaSemana,
  saudacaoPorHorario,
} from "@/lib/formatters";
import { StatusCard } from "./StatusCard";
import { AgendaHojeCard } from "./AgendaHojeCard";
import { AlertasCard } from "./AlertasCard";
import { ResumoSemanalCard } from "./ResumoSemanalCard";

const ACOES_RAPIDAS = [
  { label: "Nova venda", icone: Plus, href: "/financeiro/nova-entrada" },
  { label: "Nova despesa", icone: Minus, href: "/financeiro/nova-saida" },
  { label: "Agendamento", icone: Calendar, href: "/agenda/novo" },
  { label: "Chat", icone: Sparkles, href: "/mimu" },
] as const;

// Auth e onboarding já são garantidos pelo layout do grupo (dashboard).
export default function DashboardPage() {
  const { user, empresa, loading: carregandoAuth } = useAuth();
  const {
    dados,
    loading: carregandoDashboard,
    error,
    refetch,
  } = useDashboard();
  const { alertas, dispensar } = useAlertasProativos();

  if (carregandoAuth || carregandoDashboard || !dados) {
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

  const primeiroAcesso =
    dados.faturamentoHoje === 0 &&
    dados.faturamentoMes === 0 &&
    dados.agendamentosHoje.length === 0 &&
    dados.totalAReceber === 0 &&
    dados.totalAPagar === 0;

  return (
    <FadeIn className="flex flex-col gap-5 lg:mx-auto lg:max-w-6xl lg:gap-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-sm text-neutro-muted">
            {saudacaoPorHorario()}, {primeiroNome}
            <Hand className="h-4 w-4 text-primary-forte" strokeWidth={2.25} />
          </p>
          <p className="text-xs text-neutro-muted">
            {formatDataComDiaSemana()}
          </p>
        </div>
        <Link href="/mimu" aria-label="Falar com a Mimu">
          <LogoMark size="sm" />
        </Link>
      </header>

      {/* Quatro atalhos ocupando a linha inteira. O `max-w-md` que havia aqui
          prendia os quatro num quarto da tela e deixava o resto da linha vazio.
          No computador eles viram ícone e texto lado a lado: numa caixa larga,
          o empilhamento do celular deixaria um miolo pequeno boiando no meio
          de muito espaço. */}
      <div className="grid grid-cols-4 gap-2 lg:gap-3">
        {ACOES_RAPIDAS.map((acao) => (
          <Link
            key={acao.label}
            href={acao.href}
            className="flex flex-col items-center gap-1.5 rounded-card border border-neutro-border bg-superficie py-3 text-center transition-colors hover:bg-fundo lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:py-3.5 lg:text-left"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary-forte">
              <acao.icone className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <span className="text-[11px] font-semibold leading-tight text-escuro lg:text-sm">
              {acao.label}
            </span>
          </Link>
        ))}
      </div>

      {primeiroAcesso ? (
        <div className="rounded-[20px] bg-primary p-5 text-primary-text">
          <p className="text-sm text-primary-text/80">
            Bem-vinda, {primeiroNome}! Registre sua primeira venda para começar.
          </p>
          <Link
            href="/financeiro"
            className="mt-4 inline-flex items-center justify-center rounded-button bg-superficie px-4 py-2.5 text-sm font-semibold text-primary-forte"
          >
            + Nova venda
          </Link>
        </div>
      ) : (
        <StatusCard
          status={statusDiario}
          realizado={dados.faturamentoHoje}
          previsto={dados.faturamentoPrevisto}
          meta={metaDiaria}
          progresso={progressoDiario}
        />
      )}

      {/* Os dois saldos e a agenda dividem a mesma linha no computador. Sozinha,
          cada uma dessas coisas é pequena demais para uma linha inteira, e era
          daí que vinha a sensação de tela vazia. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:items-start lg:gap-6">
        <Link
          href="/financeiro"
          className="rounded-card border border-neutro-border bg-superficie p-4"
        >
          <p className="text-xs text-neutro-muted">A receber</p>
          <p className="mt-1 text-lg font-semibold text-verde-texto">
            {formatCurrency(dados.totalAReceber)}
          </p>
        </Link>
        <Link
          href="/financeiro"
          className="rounded-card border border-neutro-border bg-superficie p-4"
        >
          <p className="text-xs text-neutro-muted">A pagar</p>
          <p className="mt-1 text-lg font-semibold text-ambar-texto">
            {formatCurrency(dados.totalAPagar)}
          </p>
        </Link>
        <div className="col-span-2">
          <AgendaHojeCard agendamentos={dados.agendamentosHoje} />
        </div>
      </div>

      {/* O gráfico divide a linha com os alertas — mas só quando existe algum.
          O cartão de alertas some quando não há nada a dizer, e reservar um
          terço da linha para ele abriria um vão do tamanho dele. */}
      <div
        className={cn(
          "flex flex-col gap-5 lg:gap-6",
          alertas.length > 0 && "lg:grid lg:grid-cols-3 lg:items-start",
        )}
      >
        <div className={cn(alertas.length > 0 && "lg:col-span-2")}>
          <ResumoSemanalCard
            resumo={dados.resumoSemanal}
            semanaAtual={dados.faturamentoSemanaAtual}
            semanaPassada={dados.faturamentoSemanaPassada}
          />
        </div>
        <AlertasCard alertas={alertas} onDispensar={dispensar} />
      </div>
    </FadeIn>
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
