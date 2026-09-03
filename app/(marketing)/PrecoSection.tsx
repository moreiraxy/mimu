"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { SpringIn } from "@/components/marketing/SpringIn";
import { EntradaMockup } from "@/components/marketing/EntradaMockup";
import { PLANOS, MENSAGENS_MIMU_POR_DIA } from "@/lib/planos";
import { DIAS_TRIAL } from "@/lib/assinatura";

/*
 * ESTA SEÇÃO LÊ lib/planos.ts, e não pode voltar a ter preço escrito na mão.
 *
 * Ela já teve. Anunciava trimestral por R$ 99 e semestral por R$ 179 —
 * periodicidades que `Periodicidade` nunca aceitou — e o anual por R$ 299,
 * cem reais abaixo do que o checkout cobra. Quem clicasse em "Trimestral"
 * chegava numa tela que só vende mensal ou anual.
 *
 * O erro não foi de digitação: foi a seção ter a própria tabela de preços,
 * paralela à verdadeira. Duas tabelas se parecem no dia em que são escritas e
 * divergem em silêncio depois, porque só uma é usada para cobrar — e a que
 * mente é justamente a que a cliente lê antes de decidir.
 *
 * Por isso aqui não existe número solto. Preço, teto de mensagens e dias de
 * teste vêm das constantes; a economia do anual é calculada. Mudar o catálogo
 * é mexer em lib/planos.ts, e esta página acompanha sozinha.
 */

type Periodo = "mensal" | "anual";

/** Reais sem centavos — todos os valores do catálogo são inteiros. */
function emReais(valor: number): string {
  return `R$ ${valor.toLocaleString("pt-BR")}`;
}

interface Cartao {
  chave: string;
  nome: string;
  /** O preço grande. No anual continua sendo o POR MÊS: ver a nota abaixo. */
  destaque: string;
  /** A linha logo abaixo do preço. */
  legenda: string;
  /** A terceira linha, menor. `null` quando não há o que explicar. */
  cobranca: string | null;
  /** Quanto o ano economiza, em reais, ou `null`. */
  economia: number | null;
  itens: readonly string[];
  cta: string;
  /** O do meio é o destacado — borda, sombra e selo. */
  emDestaque: boolean;
}

/*
 * No anual, o preço grande é o POR MÊS e não o total do ano.
 *
 * Mesma decisão da tela de assinatura (app/(marketing)/assinar/page.tsx):
 * "R$ 399" ao lado de "R$ 39" faz o anual parecer dez vezes mais caro, quando
 * ele é mais barato por mês. O total do ano vem logo abaixo, por extenso, para
 * ninguém ser surpreendido pelo valor que vai sair do cartão.
 */
function montarCartoes(periodo: Periodo): Cartao[] {
  const anual = periodo === "anual";

  function pago(chave: "pro" | "premium", emDestaque: boolean): Cartao {
    const plano = PLANOS[chave];
    const porMes = anual
      ? Math.round(plano.valorAnual! / 12)
      : plano.valorMensal;

    return {
      chave,
      nome: plano.nome,
      destaque: emReais(porMes),
      legenda: "por mês",
      cobranca: anual
        ? `${emReais(plano.valorAnual!)} cobrados uma vez por ano`
        : "Cobrado mensalmente",
      economia: anual ? plano.valorMensal * 12 - plano.valorAnual! : null,
      itens:
        chave === "pro"
          ? [
              "Agenda e clientes ilimitados",
              "Produtos e estoque",
              "Faturamento previsto",
              "Histórico completo, sem corte",
              `${MENSAGENS_MIMU_POR_DIA.pro} mensagens por dia com a Mimu`,
              "Funciona offline",
            ]
          : [
              "Tudo o que o Pro tem",
              `${MENSAGENS_MIMU_POR_DIA.premium} mensagens por dia com a Mimu`,
              "Para quem usa a Mimu como operação",
            ],
      cta: `Começar com ${DIAS_TRIAL} dias grátis`,
      emDestaque,
    };
  }

  return [
    {
      chave: "free",
      nome: "Gratuito",
      destaque: "R$ 0",
      legenda: "para sempre",
      cobranca: "Sem cartão de crédito",
      economia: null,
      itens: [
        "Registro de vendas e despesas",
        "Faturamento do mês",
        `${MENSAGENS_MIMU_POR_DIA.free} mensagens por dia com a Mimu`,
        "Histórico do mês corrente",
        "Funciona offline",
      ],
      cta: "Começar de graça",
      emDestaque: false,
    },
    pago("pro", true),
    pago("premium", false),
  ];
}

const PERIODOS: ReadonlyArray<{ chave: Periodo; label: string }> = [
  { chave: "mensal", label: "Mensal" },
  { chave: "anual", label: "Anual" },
];

export function PrecoSection() {
  const [periodo, setPeriodo] = useState<Periodo>("anual");
  const cartoes = montarCartoes(periodo);

  return (
    <section id="preco" className="px-4 py-[48px] sm:px-6 lg:py-[80px]">
      <SpringIn>
        <h2 className="mx-auto max-w-xl text-center font-display text-[1.6rem] font-bold leading-tight tracking-tight text-escuro sm:text-4xl">
          Escolha como a Mimu vai cuidar do seu negócio.
        </h2>
      </SpringIn>
      <SpringIn delay={0.05}>
        <p className="mx-auto mt-3 max-w-md text-center text-[15px] text-neutro-muted">
          Comece de graça e fique o tempo que quiser. Nos pagos são{" "}
          {DIAS_TRIAL} dias grátis, sem cartão de crédito.
        </p>
      </SpringIn>

      <SpringIn delay={0.1}>
        <div className="mx-auto mt-8 flex w-fit gap-1 rounded-full border border-neutro-border bg-superficie p-1">
          {PERIODOS.map(({ chave, label }) => (
            <button
              key={chave}
              onClick={() => setPeriodo(chave)}
              className={`rounded-full px-5 py-2 text-[13px] font-bold transition-colors duration-200 ${
                periodo === chave
                  ? "bg-primary text-primary-text"
                  : "text-escuro"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </SpringIn>

      {/* Três colunas a partir do lg. No mobile empilha, e o Pro fica no meio —
          é a ordem que a pessoa lê de cima para baixo: grátis, o que a maioria
          escolhe, e o maior. */}
      <div className="mx-auto mt-10 grid max-w-[1100px] grid-cols-1 items-start gap-6 lg:grid-cols-3 lg:gap-5">
        {cartoes.map((cartao, indice) => (
          <EntradaMockup key={cartao.chave} delay={0.15 + indice * 0.06}>
            <div
              className={`relative flex h-full flex-col rounded-[26px] px-7 py-9 text-center ${
                cartao.emDestaque
                  ? "border-[1.5px] border-primary-forte bg-primary-light shadow-2xl shadow-primary/20"
                  : "border border-neutro-border bg-superficie"
              }`}
            >
              {cartao.emDestaque && (
                <span className="absolute -top-3.5 left-7 animate-pulse-badge rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-bold text-white">
                  Mais popular
                </span>
              )}
              {cartao.economia !== null && (
                <span className="absolute -top-3.5 right-6 whitespace-nowrap rounded-full bg-verde px-3 py-1.5 text-[10px] font-bold text-white">
                  economiza {emReais(cartao.economia)}
                </span>
              )}

              <p className="text-[13px] font-bold uppercase tracking-wide text-neutro-muted">
                {cartao.nome}
              </p>

              {/* Só o bloco de preço troca quando o período muda. Animar o cartão
                  inteiro faria a lista de itens piscar sem ter mudado nada. */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${cartao.chave}-${periodo}`}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  <p className="mt-2 font-display text-5xl font-bold tracking-tight text-escuro">
                    {cartao.destaque}
                  </p>
                  <p className="mt-1.5 text-sm text-neutro-muted">
                    {cartao.legenda}
                  </p>
                  {cartao.cobranca && (
                    <p className="mt-1 text-[13px] text-neutro-muted">
                      {cartao.cobranca}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>

              <ul className="mt-7 flex flex-col gap-3 text-left">
                {cartao.itens.map((item) => (
                  <li key={item} className="flex items-start gap-2.5">
                    <Check
                      className="mt-[3px] h-[17px] w-[17px] flex-shrink-0 text-verde-texto"
                      strokeWidth={2.6}
                    />
                    <p className="text-sm text-escuro">{item}</p>
                  </li>
                ))}
              </ul>

              {/* O invólucro com mt-auto encosta o botão no rodapé do cartão.
                  As três listas têm tamanhos diferentes, e sem isto os botões
                  ficariam em três alturas — a comparação entre planos vira uma
                  escadinha. O mt-auto vai aqui e não no <Link> porque lá ele
                  brigaria com o pt-8 pelo mesmo lado da caixa. */}
              <div className="mt-auto w-full pt-8">
                <Link
                  href="/cadastro"
                  className={`flex w-full items-center justify-center rounded-full py-3.5 text-[15px] font-bold transition-transform duration-150 active:scale-[0.97] ${
                    cartao.emDestaque
                      ? "bg-primary text-primary-text shadow-lg shadow-primary/30 hover:bg-primary-hover"
                      : "border border-neutro-border bg-transparent text-escuro hover:bg-primary-light"
                  }`}
                >
                  {cartao.cta}
                </Link>
              </div>
            </div>
          </EntradaMockup>
        ))}
      </div>

      <SpringIn delay={0.3}>
        <p className="mx-auto mt-8 max-w-lg text-center text-[13px] text-neutro-muted">
          Cancele quando quiser. O plano gratuito continua aberto depois, com o
          registro de vendas e o faturamento do mês.
        </p>
      </SpringIn>
    </section>
  );
}
