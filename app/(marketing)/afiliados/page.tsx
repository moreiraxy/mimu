import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Calendar,
  DollarSign,
  MessageCircle,
  Package,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { formatCurrency } from "@/lib/formatters";
import { linkWhatsApp } from "@/lib/contato";
import {
  COMISSAO_PERCENTUAL,
  COMISSAO_RECORRENTE,
  EMAIL_AFILIADOS,
  PROGRAMA_ATIVO,
  ganhosPorPlano,
} from "@/lib/afiliados";

export const metadata: Metadata = {
  title: "Programa de afiliados",
  description:
    "Indique a Mimu para quem toca um negócio de bairro e ganhe por cada assinatura.",
};

const PILARES = [
  {
    icone: DollarSign,
    nome: "Financeiro",
    texto: "Entrada, saída e o fechamento do dia e do mês.",
  },
  {
    icone: Calendar,
    nome: "Agenda",
    texto: "Horários do dia e lembrete automático de cliente.",
  },
  {
    icone: Package,
    nome: "Estoque",
    texto: "O que tem, o que está acabando, lista de compras.",
  },
  {
    icone: Sparkles,
    nome: "Assistente Mimu",
    texto: "Fala por áudio ou texto, em português normal, e responde na hora.",
  },
];

/*
 * O que o afiliado NÃO pode prometer.
 *
 * Está na página, e não só no contrato, de propósito. Em produto recorrente uma
 * promessa errada não vira só reclamação: vira cancelamento no mês seguinte, e
 * a comissão já foi paga. Dizer isso antes da inscrição filtra melhor do que
 * qualquer aprovação manual depois.
 */
const NAO_PROMETER = [
  "Não é maquininha nem processa pagamento de cliente",
  "Não emite nota fiscal",
  "Não faz integração com banco",
  "Não substitui contador",
];

/**
 * Página pública do programa de afiliados.
 *
 * Responde 404 enquanto `PROGRAMA_ATIVO` for false. É proposital: a página
 * precisa ser escrita com calma antes de o programa abrir, e uma página de
 * afiliados no ar sem programa ativo convida gente a se inscrever no nada.
 *
 * Nenhum número é digitado aqui. Preço e comissão saem de `lib/afiliados.ts`,
 * que por sua vez lê `lib/planos.ts` — a mesma fonte do checkout. Página de
 * afiliado com preço diferente do que a pessoa vê na hora de pagar é o tipo de
 * divergência que ninguém percebe até virar reclamação.
 */
export default function AfiliadosPage() {
  if (!PROGRAMA_ATIVO) {
    notFound();
  }

  const ganhos = ganhosPorPlano();
  const melhor = ganhos.reduce((maior, atual) =>
    atual.comissao > maior.comissao ? atual : maior,
  );

  return (
    <div className="min-h-screen bg-fundo px-6 py-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <Logo size="md" />

        <h1 className="mt-8 text-3xl font-semibold text-escuro">
          Indique a Mimu e ganhe por cada negócio que entrar.
        </h1>
        <p className="mt-3 text-base leading-relaxed text-neutro-muted">
          A Mimu é o app de gestão para o comércio de bairro: salão, barbearia,
          mercadinho, lanchonete, manicure, quem trabalha por conta. Se você já
          fala com esse público, o programa é para você.
        </p>

        <h2 className="mt-10 text-lg font-bold text-escuro">
          Quanto você ganha
        </h2>
        <p className="mt-1 text-sm text-neutro-muted">
          {COMISSAO_PERCENTUAL}% do valor de cada assinatura vendida pelo seu
          link.
          {COMISSAO_RECORRENTE === true &&
            " A comissão se repete a cada renovação, enquanto a pessoa continuar assinando."}
          {COMISSAO_RECORRENTE === false &&
            " A comissão vale sobre o primeiro pagamento de cada nova assinatura."}
        </p>

        <div className="mt-4 overflow-hidden rounded-card border border-neutro-border">
          {ganhos.map((ganho, i) => (
            <div
              key={ganho.rotulo}
              className={`flex items-center justify-between gap-4 bg-superficie px-5 py-4 ${
                i > 0 ? "border-t border-neutro-border" : ""
              }`}
            >
              <div>
                <span className="text-sm font-bold text-escuro">
                  {ganho.rotulo}
                </span>
                <span className="ml-2 text-sm text-neutro-muted">
                  {formatCurrency(ganho.precoFormatado)}
                </span>
              </div>
              <span className="shrink-0 text-base font-bold text-primary-forte">
                {formatCurrency(ganho.comissao)}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-neutro-muted">
          O plano anual é o que mais vale a pena indicar: são{" "}
          {formatCurrency(melhor.comissao)} numa venda só, e quem paga o ano
          fica muito mais tempo do que quem paga o mês.
        </p>

        <h2 className="mt-10 text-lg font-bold text-escuro">
          O que você está indicando
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {PILARES.map((pilar) => (
            <div
              key={pilar.nome}
              className="rounded-card border border-neutro-border bg-superficie p-5"
            >
              <span className="flex items-center gap-2 text-sm font-bold text-escuro">
                <pilar.icone className="h-4 w-4 shrink-0" strokeWidth={2} />
                {pilar.nome}
              </span>
              <p className="mt-2 text-sm leading-relaxed text-neutro-muted">
                {pilar.texto}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-neutro-muted">
          O que faz converter: esse público não usa planilha nem sistema, usa
          caderno. A Mimu não pede para aprender nada, é só falar com ela. Quem
          entra testa 7 dias de graça, sem cartão de crédito.
        </p>

        <h2 className="mt-10 text-lg font-bold text-escuro">
          O que não pode ser prometido
        </h2>
        <div className="mt-4 rounded-card border border-ambar-soft bg-ambar-light p-5">
          <span className="flex items-center gap-2 text-sm font-bold text-ambar-texto">
            <TriangleAlert className="h-4 w-4 shrink-0" strokeWidth={2} />
            Leia antes de anunciar
          </span>
          <ul className="mt-3 flex flex-col gap-1.5">
            {NAO_PROMETER.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-ambar-texto">
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-ambar-texto">
            Venda feita com promessa que a Mimu não cumpre vira reembolso, e
            reembolso cancela a comissão. Anunciar certo é o que mantém o seu
            ganho de pé.
          </p>
        </div>

        <h2 className="mt-10 text-lg font-bold text-escuro">Como participar</h2>
        <p className="mt-1 text-sm leading-relaxed text-neutro-muted">
          Cada pedido é aprovado por nós, uma a uma — a Mimu é usada por gente
          que confia em quem indicou, e isso não pode ser automático.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={linkWhatsApp(
              "Oi! Quero participar do programa de afiliados da Mimu.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-button bg-primary px-6 py-3.5 text-sm font-bold text-primary-text transition-colors hover:bg-primary-hover"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={2} />
            Quero ser afiliado
          </a>

          {EMAIL_AFILIADOS && (
            <a
              href={`mailto:${EMAIL_AFILIADOS}`}
              className="flex items-center justify-center rounded-button border border-neutro-border px-6 py-3.5 text-sm font-bold text-escuro transition-colors hover:bg-superficie"
            >
              {EMAIL_AFILIADOS}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
