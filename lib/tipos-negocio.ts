import {
  Cog,
  Pencil,
  Scissors,
  ShoppingCart,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface OpcaoTipoNegocio {
  id: string;
  icone: LucideIcon;
  label: string;
}

/** Opções do passo 1 do onboarding — reaproveitadas em Minha Empresa pra edição. */
export const OPCOES_TIPO_NEGOCIO: OpcaoTipoNegocio[] = [
  { id: "salao", icone: Scissors, label: "Salão / Barbearia / Manicure" },
  { id: "mercado", icone: ShoppingCart, label: "Loja / Mercado" },
  {
    id: "restaurante",
    icone: UtensilsCrossed,
    label: "Restaurante / Lanchonete",
  },
  { id: "servico", icone: Wrench, label: "Prestador de serviço" },
  { id: "oficina", icone: Cog, label: "Oficina" },
  { id: "outro", icone: Pencil, label: "Outro" },
];

export const IDS_TIPO_NEGOCIO_CONHECIDOS: string[] = OPCOES_TIPO_NEGOCIO.filter(
  (o) => o.id !== "outro",
).map((o) => o.id);
