import { LayoutDashboard, Package, Target, UserRound } from "lucide-react";
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
    prioridade: 4,
    label: "Financeiro",
    Icon: FinanceiroIcon,
    modulo: "financeiro" as ModuloAtivo,
  },
  {
    href: "/clientes",
    prioridade: 5,
    label: "Clientes",
    Icon: ClientesIcon,
    modulo: "clientes" as ModuloAtivo,
  },
  { href: "/mimu", prioridade: 1, label: "Mimu", Icon: MimuIcon, modulo: "ia" as ModuloAtivo },
  /*
   * O Posto de Comando vem antes de tudo que não seja a Home e a Mimu.
   *
   * `prioridade` ordena a barra de baixo, onde cabem poucos itens. Para quem
   * tem o posto ligado, ele é a tela do dia — deixá-lo na cauda significaria
   * que a tela mais usada vive atrás do "mais".
   *
   * MAS A BARRA SÓ TEM TRÊS DESTINOS (ver DESTINOS_NA_BARRA em BottomNav: a
   * Mimu é o botão da marca e não conta). Quando o posto entrou com
   * prioridade 2, ele empurrou a AGENDA para dentro do "Mais" — e o primeiro
   * retorno dela foi exatamente "quero o calendário de volta".
   *
   * A ordem agora é Home, Posto, Agenda. O Financeiro saiu da barra porque é
   * o único dos quatro que tem outra porta à mão: os botões "Entrou dinheiro"
   * e "Gastei" ficam no cartão de dinheiro do próprio posto. Tirar o
   * calendário não tem compensação nenhuma — ele é consulta, não lançamento.
   */
  {
    href: "/posto",
    prioridade: 2,
    label: "Posto",
    Icon: LayoutDashboard,
    modulo: "posto" as ModuloAtivo,
  },
  {
    href: "/metas",
    prioridade: 6,
    label: "Metas",
    Icon: Target,
    modulo: "financeiro" as ModuloAtivo,
  },
  {
    href: "/produtos",
    prioridade: 7,
    label: "Produtos",
    Icon: Package,
    modulo: "estoque" as ModuloAtivo,
  },
  /*
   * "Perfil", e não mais "Empresa".
   *
   * O destino mudou de conteúdo: era uma página de ajustes do negócio e virou
   * a tela da CONTA — foto, plano, assinatura, senha, biometria, suporte,
   * sair. Os dados do negócio continuam lá dentro, uma linha entre as outras.
   * "Empresa" mandaria procurar "sair da conta" em qualquer outro lugar.
   */
  {
    href: "/minha-empresa",
    prioridade: 8,
    label: "Perfil",
    Icon: UserRound,
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
