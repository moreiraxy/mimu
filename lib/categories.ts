import {
  Bike,
  Carrot,
  CheckCircle,
  Cog,
  CreditCard,
  DollarSign,
  Hammer,
  Hand,
  HardHat,
  Home,
  Lightbulb,
  MoreHorizontal,
  Package,
  Palette,
  Scissors,
  ShoppingBag,
  Sparkles,
  Truck,
  User,
  UtensilsCrossed,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * Ícone por nome de categoria — cobre as categorias padrão semeadas por
 * `seed_categorias_padrao` (ver migration) mais as antigas. Categorias
 * criadas manualmente pela usuária (Minha Empresa → Categorias) caem no
 * fallback DollarSign; não há como adivinhar um ícone pra texto livre.
 */
const ICONES_CATEGORIA: Record<string, LucideIcon> = {
  Serviço: Wrench,
  "Serviço prestado": Wrench,
  Produto: Package,
  Recebimento: CreditCard,
  Aluguel: Home,
  Fornecedor: Truck,
  Energia: Lightbulb,
  Funcionário: User,
  Corte: Scissors,
  Coloração: Palette,
  Manicure: Hand,
  "Produtos de beleza": Sparkles,
  "Venda balcão": ShoppingBag,
  "Fiado quitado": CheckCircle,
  "Consumo no local": UtensilsCrossed,
  Delivery: Bike,
  "Mão de obra": HardHat,
  Peças: Cog,
  Ingredientes: Carrot,
  Material: Package,
  Transporte: Truck,
  Ferramentas: Hammer,
  Outro: MoreHorizontal,
};

export function iconePorCategoria(categoria: string | null): LucideIcon {
  if (!categoria) return DollarSign;
  return ICONES_CATEGORIA[categoria] ?? DollarSign;
}
