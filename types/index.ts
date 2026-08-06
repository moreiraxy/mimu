import type { Database } from "@/types/database";

// ---------------------------------------------------------------------------
// Tabelas
// ---------------------------------------------------------------------------

export type Empresa = Database["public"]["Tables"]["empresas"]["Row"];
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
export type Agendamento = Database["public"]["Tables"]["agendamentos"]["Row"];
export type Transacao = Database["public"]["Tables"]["transacoes"]["Row"];
export type Meta = Database["public"]["Tables"]["metas"]["Row"];
export type ConversaMimu =
  Database["public"]["Tables"]["conversas_mimu"]["Row"];
export type AlertaMimu = Database["public"]["Tables"]["alertas_mimu"]["Row"];
export type Categoria = Database["public"]["Tables"]["categorias"]["Row"];
export type Produto = Database["public"]["Tables"]["produtos"]["Row"];
export type MovimentacaoEstoque =
  Database["public"]["Tables"]["movimentacoes_estoque"]["Row"];
export type Fornecedor = Database["public"]["Tables"]["fornecedores"]["Row"];
export type Compra = Database["public"]["Tables"]["compras"]["Row"];
export type CompraItem = Database["public"]["Tables"]["compras_itens"]["Row"];
export type PushSubscriptionRow =
  Database["public"]["Tables"]["push_subscriptions"]["Row"];
export type Assinatura = Database["public"]["Tables"]["assinaturas"]["Row"];
export type Pagamento = Database["public"]["Tables"]["pagamentos"]["Row"];

export type {
  FormaPagamento,
  FormaPagamentoMP,
  PlanoAssinatura,
  RoleConversa,
  StatusAgendamento,
  StatusAssinatura,
  StatusPagamento,
  StatusPagamentoMP,
  Tema,
  TipoAlerta,
  TipoCategoria,
  TipoMovimentacaoEstoque,
  TipoTransacao,
} from "@/types/database";

// ---------------------------------------------------------------------------
// Tipos derivados (queries com join)
// ---------------------------------------------------------------------------

export type AgendamentoComCliente = Agendamento & {
  cliente: Cliente | null;
};

export type TransacaoComCliente = Transacao & {
  cliente: Cliente | null;
};

export type MovimentacaoComProduto = MovimentacaoEstoque & {
  produto: Pick<Produto, "id" | "nome"> | null;
};

export type CompraComFornecedor = Compra & {
  fornecedor: Pick<Fornecedor, "id" | "nome"> | null;
};

export type CompraItemComProduto = CompraItem & {
  produto: Pick<Produto, "id" | "nome"> | null;
};

// ---------------------------------------------------------------------------
// Enums (union types, no estilo já usado em types/database.ts)
// ---------------------------------------------------------------------------

/**
 * Opções do passo 1 do onboarding (ver app/onboarding/negocio). O DB aceita
 * texto livre em `empresas.tipo_negocio` (inclusive quando a usuária escolhe
 * "outro" e digita algo próprio) — este tipo documenta só os valores
 * conhecidos, não é a validação da coluna.
 */
export type TipoNegocio =
  | "salao"
  | "mercado"
  | "restaurante"
  | "servico"
  | "oficina"
  | "outro";

/** Chaves possíveis em `empresas.modulos_ativos`. */
export type ModuloAtivo =
  | "financeiro"
  | "agenda"
  | "clientes"
  | "estoque"
  | "ia";

export interface ConfigAlertaHorario {
  ativo: boolean;
  hora: number;
}

/** Formato de `empresas.config_alertas` — só os alertas com horário configurável. */
export interface ConfigAlertas {
  sem_venda: ConfigAlertaHorario;
  agendamento_pendente: ConfigAlertaHorario;
}

// ---------------------------------------------------------------------------
// Tipos de resposta de API (server actions / route handlers)
// ---------------------------------------------------------------------------

export type ApiSuccess<T = undefined> = T extends undefined
  ? { success: true }
  : { success: true; data: T };

export type ApiError = {
  success: false;
  error: string;
};

export type ApiResponse<T = undefined> = ApiSuccess<T> | ApiError;
