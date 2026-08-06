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
  { href: "/dashboard", label: "Home", Icon: HomeIcon, modulo: null },
  {
    href: "/agenda",
    label: "Agenda",
    Icon: AgendaIcon,
    modulo: "agenda" as ModuloAtivo,
  },
  {
    href: "/financeiro",
    label: "Financeiro",
    Icon: FinanceiroIcon,
    modulo: "financeiro" as ModuloAtivo,
  },
  {
    href: "/clientes",
    label: "Clientes",
    Icon: ClientesIcon,
    modulo: "clientes" as ModuloAtivo,
  },
  { href: "/mimu", label: "Mimu", Icon: MimuIcon, modulo: "ia" as ModuloAtivo },
  {
    href: "/metas",
    label: "Metas",
    Icon: Target,
    modulo: "financeiro" as ModuloAtivo,
  },
  {
    href: "/produtos",
    label: "Produtos",
    Icon: Package,
    modulo: "estoque" as ModuloAtivo,
  },
  {
    href: "/minha-empresa",
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
