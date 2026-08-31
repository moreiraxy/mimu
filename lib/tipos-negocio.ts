import {
  Clock,
  Cog,
  Pencil,
  Scissors,
  ShoppingCart,
  UtensilsCrossed,
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
  // Quem é o próprio negócio: manicure que atende em casa, professora
  // particular, terapeuta, cartomante, personal. O rótulo antigo era
  // "Prestador de serviço", que ninguém usa pra se descrever e soa como
  // categoria de nota fiscal. Aqui a pessoa se reconhece pelo que ela faz:
  // tem hora marcada, não tem balcão. O `id` não muda, pra não invalidar o
  // que já está gravado em `empresas.tipo_negocio`.
  { id: "servico", icone: Clock, label: "Atendo por hora marcada" },
  { id: "oficina", icone: Cog, label: "Oficina" },
  { id: "outro", icone: Pencil, label: "Outro" },
];

export const IDS_TIPO_NEGOCIO_CONHECIDOS: string[] = OPCOES_TIPO_NEGOCIO.filter(
  (o) => o.id !== "outro",
).map((o) => o.id);
