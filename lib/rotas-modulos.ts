import type { ModuloAtivo } from "@/types";

/**
 * Qual módulo cada rota exige.
 *
 * Existe separado de components/dashboard/navItems.ts por dois motivos. O
 * primeiro é técnico: aquele arquivo importa ícones do lucide-react, e o
 * middleware não pode arrastar isso para o bundle do edge. O segundo é de
 * cobertura: NAV_ITEMS lista o que aparece no MENU, e o menu não tem item
 * para /estoque, /compras, /fornecedores nem /faturamento — que existem e
 * são alcançáveis digitando a URL.
 *
 * E é exatamente aí que mora o risco: esconder o item do menu não fecha a
 * porta. Uma conta gratuita que digitasse /agenda entrava normalmente antes
 * deste arquivo existir.
 *
 * Rota nova de módulo entra AQUI no mesmo commit em que nasce. Uma que fique
 * de fora fica aberta para todo mundo, e isso não aparece em teste nenhum —
 * só na fatura da Groq, no caso da Mimu.
 */
export const MODULO_POR_ROTA: Record<string, ModuloAtivo> = {
  "/agenda": "agenda",
  "/clientes": "clientes",

  // O financeiro inteiro anda junto: caixa, faturamento e metas são leituras
  // do mesmo dado, e o plano gratuito inclui os três. É o que sobra de graça
  // — o resto do negócio é o que se paga.
  "/financeiro": "financeiro",
  "/faturamento": "financeiro",
  "/metas": "financeiro",

  // Produtos, estoque, compras e fornecedores são o mesmo módulo visto de
  // quatro telas.
  "/produtos": "estoque",
  "/estoque": "estoque",
  "/compras": "estoque",
  "/fornecedores": "estoque",

  "/mimu": "ia",

  /*
   * A rota de API da Mimu entra na lista, e não é detalhe.
   *
   * Bloquear só a tela /mimu deixaria um POST direto em /api/mimu respondendo
   * normalmente — e cada resposta dessas é dinheiro na Groq, gasto com quem
   * não paga pela IA. É o único módulo em que furar o teto tem custo por uso,
   * e por isso o único que precisa das duas portas fechadas.
   */
  "/api/mimu": "ia",
};

/**
 * O módulo que a rota exige, ou null quando ela é livre.
 *
 * Compara por prefixo para as rotas filhas irem junto: /produtos/novo e
 * /produtos/<id> exigem o mesmo que /produtos, sem precisar listar cada uma.
 */
export function moduloExigidoPor(pathname: string): ModuloAtivo | null {
  for (const [rota, modulo] of Object.entries(MODULO_POR_ROTA)) {
    if (pathname === rota || pathname.startsWith(`${rota}/`)) return modulo;
  }
  return null;
}
