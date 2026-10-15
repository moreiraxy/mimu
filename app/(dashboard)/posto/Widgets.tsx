"use client";

import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Flame,
  UserRound,
  Wallet,
} from "lucide-react";
import { Valor } from "@/components/Valor";
import { ROTINA, paraHora, type EstadoDaRotina } from "@/lib/posto/rotina";
import { NUMEROS, bateuAMeta, formatarValor } from "@/lib/posto/numeros";
import type { ResumoDoDinheiro } from "@/lib/posto/financas";
import type { Database } from "@/types/database";
import type { Cliente } from "@/types";
import { cn } from "@/lib/utils";
import { ROTULO } from "./estilos";

type Pendencia = Database["public"]["Tables"]["posto_pendencias"]["Row"];

/**
 * OS WIDGETS DO PAINEL INICIAL — as métricas do trabalho dela.
 *
 * "no painel inicial todos os widgets sumiram, eu quero widgets com as novas
 * métricas e funções na parte inicial do aparelho móvel."
 *
 * Os widgets antigos existem e funcionam (lib/widgets.ts): faturamento do dia,
 * a receber, a pagar, gráfico da semana. Só que eles vivem na Home do produto
 * de salão — que saiu da navegação dela — e medem um negócio de balcão. Como o
 * posto virou a casa, o painel inicial ficou sem nenhum número de relance.
 *
 * SEIS NÚMEROS, ESCOLHIDOS PELO QUE ELA FAZ COM ELES:
 *
 *   Rotina        quanto do dia acordado já foi cumprido
 *   Em aberto     o tamanho da fila de memória, com os urgentes destacados
 *   Hoje          compromissos do dia e a hora do próximo
 *   Leads parados o estoque de trabalho da ativação de base — quem não é
 *                 falado há 5 dias ou mais, que é a regra escrita do cargo
 *   Primeiro contato  o indicador diário mais cobrado dela
 *   Sobrou        entradas menos saídas do mês (NÃO é saldo de caixa)
 *
 * DUAS COLUNAS NO CELULAR, três a partir de `sm`. Não é grade decorativa: no
 * celular, três colunas deixariam "R$ 2.300,00" quebrando em duas linhas, e o
 * número é a única coisa que o widget precisa entregar de longe.
 *
 * Cada um é um LINK, e esse é o ponto que separa widget de enfeite: o número
 * responde "como está" e o toque leva a "onde eu mexo".
 */

/** Parados há 5 dias ou mais — a regra do item 3.5 do documento de funções. */
const DIAS_PARA_ESFRIAR = 5;

export function Widgets({
  rotina,
  pendencias,
  compromissosHoje,
  numeros,
  dinheiro,
  leads,
  hoje,
  irPara,
  irParaDinheiro,
}: {
  rotina: EstadoDaRotina;
  pendencias: Pendencia[];
  compromissosHoje: { horario: string }[];
  numeros: Record<string, number>;
  dinheiro: ResumoDoDinheiro;
  leads: Cliente[];
  /** Hoje em "AAAA-MM-DD", no fuso de Brasília. */
  hoje: string;
  /** Rola até uma seção desta tela. */
  irPara: (id: string) => void;
  /** Troca para a aba do dinheiro. */
  irParaDinheiro: () => void;
}) {
  const urgentes = pendencias.filter((p) => p.urgente).length;

  /*
   * Comparação de TEXTO entre datas "AAAA-MM-DD".
   *
   * `new Date("2026-10-10")` é meia-noite em UTC, que aqui ainda é dia 9 às
   * 21h — contar dias com Date faria "parado há 5 dias" virar 4 ou 6 conforme
   * a hora em que ela olha a tela.
   */
  const limite = (() => {
    const [ano, mes, dia] = hoje.split("-").map(Number);
    const d = new Date(Date.UTC(ano!, mes! - 1, dia! - DIAS_PARA_ESFRIAR));
    return d.toISOString().slice(0, 10);
  })();

  const parados = leads.filter(
    (l) => !l.ultimo_atendimento || l.ultimo_atendimento <= limite,
  ).length;

  const proximo = compromissosHoje[0]?.horario ?? null;
  const primeiroContato = NUMEROS.find(
    (n) => n.chave === "tempo_primeiro_contato",
  )!;
  const valorContato = numeros[primeiroContato.chave];
  const statusContato = bateuAMeta(primeiroContato, valorContato);

  return (
    <section>
      <p className={cn("mb-2 block", ROTULO)}>De relance</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Widget
          aoTocar={() => irPara("rotina")}
          icone={CheckCircle2}
          rotulo="Rotina"
          valor={`${rotina.feitos.length}/${ROTINA.length}`}
          detalhe={
            rotina.atrasados.length > 0
              ? `${rotina.atrasados.length} passou da hora`
              : rotina.proximo
                ? `próximo ${paraHora(rotina.proximo.inicio)}`
                : "dia fechado"
          }
          alerta={rotina.atrasados.length > 0}
        />

        <Widget
          aoTocar={() => irPara("aberto")}
          icone={Flame}
          rotulo="Em aberto"
          valor={String(pendencias.length)}
          detalhe={urgentes > 0 ? `${urgentes} urgente` : "nada urgente"}
          alerta={urgentes > 0}
        />

        <Widget
          href="/agenda"
          icone={CalendarDays}
          rotulo="Hoje"
          valor={String(compromissosHoje.length)}
          detalhe={proximo ? `próximo ${proximo}` : "sem compromisso"}
        />

        <Widget
          href="/leads"
          icone={UserRound}
          rotulo="Leads parados"
          valor={String(parados)}
          detalhe={`${DIAS_PARA_ESFRIAR} dias ou mais`}
          alerta={parados > 0}
        />

        <Widget
          aoTocar={() => irPara("numeros")}
          icone={Clock}
          rotulo="1º contato"
          valor={
            valorContato === undefined
              ? "—"
              : formatarValor(primeiroContato, valorContato)
          }
          detalhe={
            valorContato === undefined ? "falta anotar" : primeiroContato.metaTexto
          }
          alerta={statusContato === false}
        />

        <WidgetDinheiro sobrou={dinheiro.sobrou} aoTocar={irParaDinheiro} />
      </div>
    </section>
  );
}

function Widget({
  href,
  aoTocar,
  icone: Icone,
  rotulo,
  valor,
  detalhe,
  alerta = false,
}: {
  /** Rota, quando o destino é outra tela. */
  href?: string;
  /**
   * Ação na própria tela, quando o destino está aqui — rolar até a seção ou
   * trocar de aba. Âncora (`#rotina`) não serviria: a seção de dinheiro vive
   * em OUTRA aba, e um link de hash não troca de aba, só não faz nada.
   */
  aoTocar?: () => void;
  icone: typeof Clock;
  rotulo: string;
  valor: string;
  detalhe: string;
  /** Pinta a borda quando o número pede ação. Nunca o fundo todo: seis
      widgets alarmados ao mesmo tempo não dizem onde olhar primeiro. */
  alerta?: boolean;
}) {
  const classe = cn(
    "block rounded-[10px] border bg-superficie/70 p-3 text-left transition",
    alerta ? "border-ambar-soft" : "border-neutro-border",
  );

  const conteudo = (
    <>
      <Icone className="size-3.5 text-neutro-muted" />
      <p className="mt-1.5 truncate text-[11px] font-bold uppercase tracking-[0.06em] text-neutro-muted">
        {rotulo}
      </p>
      <p className="text-[20px] font-bold leading-tight text-escuro">{valor}</p>
      <p className="truncate text-[11px] text-neutro-muted">{detalhe}</p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classe}>
        {conteudo}
      </Link>
    );
  }
  return (
    <button type="button" onClick={aoTocar} className={classe}>
      {conteudo}
    </button>
  );
}

/** Separado porque dinheiro passa pelo olho de esconder (<Valor>). */
function WidgetDinheiro({
  sobrou,
  aoTocar,
}: {
  sobrou: number;
  aoTocar: () => void;
}) {
  return (
    <button
      type="button"
      onClick={aoTocar}
      className="block rounded-[10px] border border-neutro-border bg-superficie/70 p-3 text-left"
    >
      <Wallet className="size-3.5 text-neutro-muted" />
      <p className="mt-1.5 truncate text-[11px] font-bold uppercase tracking-[0.06em] text-neutro-muted">
        Sobrou no mês
      </p>
      <Valor
        valor={sobrou}
        className="block text-[20px] font-bold leading-tight text-escuro"
      />
      <p className="truncate text-[11px] text-neutro-muted">
        entradas menos saídas
      </p>
    </button>
  );
}
