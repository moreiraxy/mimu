import { Calendar, Minus, Plus, User } from "lucide-react";

/**
 * As ações de criar, que antes moravam dentro do FAB flutuante.
 *
 * Saíram de lá para cá porque agora quem as abre é o botão "+" DENTRO da
 * barra de baixo, e a folha de ações precisa da mesma lista sem importar o
 * componente do botão antigo junto.
 *
 * "Falar com a Mimu" saiu da lista: a Mimu agora tem porta própria e fixa, o
 * botão da marca no canto direito da barra. Repetir aqui daria dois caminhos
 * para a mesma tela na mesma barra.
 */
export const ACOES_RAPIDAS = [
  { label: "Nova venda", icone: Plus, href: "/financeiro/nova-entrada", modulo: "financeiro" },
  { label: "Nova despesa", icone: Minus, href: "/financeiro/nova-saida", modulo: "financeiro" },
  { label: "Novo agendamento", icone: Calendar, href: "/agenda/novo", modulo: "agenda" },
  { label: "Novo cliente", icone: User, href: "/clientes/novo", modulo: "clientes" },
] as const;

/**
 * Rotas que já SÃO um formulário de criação.
 *
 * Oferecer "criar" dentro da tela de criar é redundante, e o botão fixo cai
 * exatamente em cima do botão de confirmar do formulário.
 */
export const ROTAS_SEM_ACOES = [
  "/financeiro/nova-entrada",
  "/financeiro/nova-saida",
  "/agenda/novo",
  "/clientes/novo",
  "/produtos/novo",
];

/** Só as ações cujo módulo a conta tem ligado — criar venda sem financeiro leva a uma tela vazia. */
export function acoesLiberadas(modulos: readonly string[]) {
  return ACOES_RAPIDAS.filter((acao) => modulos.includes(acao.modulo));
}
