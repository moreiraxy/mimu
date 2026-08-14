import { Package, Settings, Target } from "lucide-react";
import {
  AgendaIcon,
  ClientesIcon,
  FinanceiroIcon,
  HomeIcon,
  MimuIcon,
} from "@/components/icons/NavIcons";
import type { ModuloAtivo } from "@/types";

export const NAV_ITEMS = [
  { href: "/dashboard", prioridade: 0, label: "Home", Icon: HomeIcon, modulo: null },
  {
    href: "/agenda",
    prioridade: 3,
    label: "Agenda",
    Icon: AgendaIcon,
    modulo: "agenda" as ModuloAtivo,
  },
  {
    href: "/financeiro",
    prioridade: 2,
    label: "Financeiro",
    Icon: FinanceiroIcon,
    modulo: "financeiro" as ModuloAtivo,
  },
  {
    href: "/clientes",
    prioridade: 4,
    label: "Clientes",
    Icon: ClientesIcon,
    modulo: "clientes" as ModuloAtivo,
  },
  { href: "/mimu", prioridade: 1, label: "Mimu", Icon: MimuIcon, modulo: "ia" as ModuloAtivo },
  {
    href: "/metas",
    prioridade: 5,
    label: "Metas",
    Icon: Target,
    modulo: "financeiro" as ModuloAtivo,
  },
  {
    href: "/produtos",
    prioridade: 6,
    label: "Produtos",
    Icon: Package,
    modulo: "estoque" as ModuloAtivo,
  },
  {
    href: "/minha-empresa",
    prioridade: 7,
    label: "Empresa",
    Icon: Settings,
    modulo: null,
  },
] as const;

/** Home e Minha Empresa sempre aparecem; os demais só se o módulo estiver ativo. */
export function navItemsVisiveis(modulosAtivos: string[]) {
  return NAV_ITEMS.filter(
    (item) => item.modulo === null || modulosAtivos.includes(item.modulo),
  );
}

/**
 * Quantos destinos cabem na barra de baixo antes do botão "Mais".
 *
 * Com todos os módulos ligados são 8 destinos. Espremidos numa tela de 360px
 * sobram ~40px por ícone — abaixo do alvo de toque de 44px, e sem espaço pro
 * rótulo, o que obrigava a adivinhar cada ícone. Com 4 + "Mais", cada um fica
 * com ~72px e cabe o nome embaixo.
 */
const VAGAS_NA_BARRA = 4;

/**
 * Divide os destinos entre a barra de baixo e o menu.
 *
 * A escolha de quem fica na barra é por `prioridade`, não pela ordem da lista:
 * a Mimu é o coração do produto (e é onde chegam os alertas), então ela não
 * pode cair no menu só por estar declarada depois de Agenda e Financeiro.
 *
 * O menu recebe TODOS os destinos, inclusive os que já estão na barra. Repetir
 * é de propósito: o menu vira o mapa completo do app, e ninguém precisa
 * lembrar se um item está na barra ou escondido.
 */
export function dividirNavegacao(modulosAtivos: string[]) {
  const visiveis = navItemsVisiveis(modulosAtivos);
  const naBarra = [...visiveis]
    .sort((a, b) => a.prioridade - b.prioridade)
    .slice(0, VAGAS_NA_BARRA);

  return {
    // Reordena pela ordem original: a barra deve ficar estável, e não pular
    // de lugar conforme a prioridade.
    barra: visiveis.filter((item) => naBarra.includes(item)),
    menu: visiveis,
    // Só vale mostrar "Mais" se ele revelar algo que não está na barra.
    temMais: visiveis.length > naBarra.length,
  };
}
