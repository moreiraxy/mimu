import { Calendar, DollarSign, Package, Sparkles, type LucideIcon } from "lucide-react";
import type { ModuloAtivo } from "@/types";

export interface ModuloCard {
  id: string;
  icone: LucideIcon;
  label: string;
  descricao: string;
  chaves: ModuloAtivo[];
}

/**
 * Os 4 cards de módulo mostrados no onboarding e em Minha Empresa — cada
 * card liga a uma ou mais chaves de `empresas.modulos_ativos`.
 */
export const MODULOS: ModuloCard[] = [
  {
    id: "agenda_clientes",
    icone: Calendar,
    label: "Agenda e Clientes",
    descricao: "Agendamentos, clientes fiéis, lembretes",
    chaves: ["agenda", "clientes"],
  },
  {
    id: "financeiro",
    icone: DollarSign,
    label: "Financeiro",
    descricao: "Caixa, entradas, saídas, contas a pagar e receber",
    chaves: ["financeiro"],
  },
  {
    id: "estoque",
    icone: Package,
    label: "Produtos e Estoque",
    descricao: "Produtos, estoque, compras, fornecedores",
    chaves: ["estoque"],
  },
  {
    id: "mimu",
    icone: Sparkles,
    label: "Assistente Mimu",
    descricao: "Chat inteligente, alertas automáticos, insights",
    chaves: ["ia"],
  },
];

export const PRESELECAO_MODULOS: Record<string, string[]> = {
  salao: ["agenda_clientes", "financeiro", "mimu"],
  mercado: ["financeiro", "estoque", "mimu"],
  restaurante: ["financeiro", "estoque", "mimu"],
  servico: ["agenda_clientes", "financeiro", "mimu"],
};
// oficina/outro não têm regra definida — assumimos o mínimo comum aos
// quatro tipos de negócio mapeados (financeiro + mimu).
export const PRESELECAO_MODULOS_PADRAO = ["financeiro", "mimu"];

export function cartaoIdsParaChaves(ids: string[]): string[] {
  return Array.from(
    new Set(
      MODULOS.filter((modulo) => ids.includes(modulo.id)).flatMap(
        (modulo) => modulo.chaves,
      ),
    ),
  );
}

export function chavesParaCartaoIds(chaves: string[]): string[] {
  return MODULOS.filter((modulo) =>
    modulo.chaves.every((chave) => chaves.includes(chave)),
  ).map((modulo) => modulo.id);
}
