/**
 * Tipos do schema do Supabase, escritos a partir das migrations em
 * supabase/migrations/. Depois de aplicar mudanças de schema, prefira
 * regerar via CLI para manter tudo em sincronia:
 *
 *   npx supabase gen types typescript --project-id <PROJECT_ID> > types/database.ts
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type TipoTransacao = "entrada" | "saida";
export type StatusPagamento = "pendente" | "pago";
export type FormaPagamento = "dinheiro" | "pix" | "debito" | "credito";
export type StatusAgendamento =
  | "confirmado"
  | "pendente"
  | "nao_compareceu"
  | "concluido";
export type Tema = "claro" | "escuro";
export type RoleConversa = "user" | "assistant";
export type TipoAlerta =
  | "sem_venda"
  | "agendamento_pendente"
  | "conta_vencida"
  | "meta_risco"
  | "recorde"
  | "cliente_sumiu"
  | "estoque_baixo"
  | "tentativa_prompt_injection";
export type TipoCategoria = "entrada" | "saida";
export type TipoMovimentacaoEstoque = "entrada" | "saida" | "ajuste";
export type StatusAssinatura = "trial" | "ativa" | "cancelada" | "vencida";
export type PlanoAssinatura = "basico" | "completo";
export type StatusPagamentoMP =
  | "pendente"
  | "aprovado"
  | "recusado"
  | "reembolsado";
export type FormaPagamentoMP = "pix" | "cartao";

export interface Database {
  public: {
    Tables: {
      empresas: {
        Row: {
          id: string;
          user_id: string;
          nome: string;
          tipo_negocio: string | null;
          telefone: string | null;
          endereco: string | null;
          logo_url: string | null;
          horario_funcionamento: Json | null;
          meta_mensal: number | null;
          meta_diaria: number | null;
          modulos_ativos: string[];
          tema: Tema;
          onboarding_concluido: boolean;
          clientes_por_semana_media: number | null;
          config_alertas: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nome: string;
          tipo_negocio?: string | null;
          telefone?: string | null;
          endereco?: string | null;
          logo_url?: string | null;
          horario_funcionamento?: Json | null;
          meta_mensal?: number | null;
          meta_diaria?: number | null;
          modulos_ativos?: string[];
          tema?: Tema;
          onboarding_concluido?: boolean;
          clientes_por_semana_media?: number | null;
          config_alertas?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["empresas"]["Insert"]>;
        Relationships: [];
      };
      clientes: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          telefone: string | null;
          email: string | null;
          data_nascimento: string | null;
          observacoes: string | null;
          saldo_fiado: number;
          total_gasto: number;
          total_visitas: number;
          ultimo_atendimento: string | null;
          frequencia_media_dias: number | null;
          cliente_fiel: boolean;
          faltas: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          telefone?: string | null;
          email?: string | null;
          data_nascimento?: string | null;
          observacoes?: string | null;
          saldo_fiado?: number;
          total_gasto?: number;
          total_visitas?: number;
          ultimo_atendimento?: string | null;
          frequencia_media_dias?: number | null;
          cliente_fiel?: boolean;
          faltas?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["clientes"]["Insert"]>;
        Relationships: [];
      };
      agendamentos: {
        Row: {
          id: string;
          empresa_id: string;
          cliente_id: string | null;
          titulo: string;
          descricao: string | null;
          valor_previsto: number | null;
          data_hora: string;
          duracao_minutos: number | null;
          status: StatusAgendamento;
          pagamento_registrado: boolean;
          transacao_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          cliente_id?: string | null;
          titulo: string;
          descricao?: string | null;
          valor_previsto?: number | null;
          data_hora: string;
          duracao_minutos?: number | null;
          status?: StatusAgendamento;
          pagamento_registrado?: boolean;
          transacao_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["agendamentos"]["Insert"]
        >;
        Relationships: [];
      };
      transacoes: {
        Row: {
          id: string;
          empresa_id: string;
          cliente_id: string | null;
          agendamento_id: string | null;
          tipo: TipoTransacao;
          valor: number;
          descricao: string | null;
          categoria: string | null;
          forma_pagamento: FormaPagamento | null;
          parcelas: number;
          parcela_atual: number;
          grupo_parcelamento_id: string | null;
          data: string;
          data_vencimento: string | null;
          status_pagamento: StatusPagamento;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          cliente_id?: string | null;
          agendamento_id?: string | null;
          tipo: TipoTransacao;
          valor: number;
          descricao?: string | null;
          categoria?: string | null;
          forma_pagamento?: FormaPagamento | null;
          parcelas?: number;
          parcela_atual?: number;
          grupo_parcelamento_id?: string | null;
          data: string;
          data_vencimento?: string | null;
          status_pagamento?: StatusPagamento;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transacoes"]["Insert"]>;
        Relationships: [];
      };
      metas: {
        Row: {
          id: string;
          empresa_id: string;
          mes: number;
          ano: number;
          valor_meta: number | null;
          valor_realizado: number;
          bateu_meta: boolean;
          recorde: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          mes: number;
          ano: number;
          valor_meta?: number | null;
          valor_realizado?: number;
          bateu_meta?: boolean;
          recorde?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["metas"]["Insert"]>;
        Relationships: [];
      };
      conversas_mimu: {
        Row: {
          id: string;
          empresa_id: string;
          role: RoleConversa;
          content: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          role: RoleConversa;
          content: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["conversas_mimu"]["Insert"]
        >;
        Relationships: [];
      };
      alertas_mimu: {
        Row: {
          id: string;
          empresa_id: string;
          tipo: TipoAlerta;
          mensagem: string | null;
          metadata: Json | null;
          lido: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          tipo: TipoAlerta;
          mensagem?: string | null;
          metadata?: Json | null;
          lido?: boolean;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["alertas_mimu"]["Insert"]
        >;
        Relationships: [];
      };
      categorias: {
        Row: {
          id: string;
          empresa_id: string;
          tipo: TipoCategoria;
          nome: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          tipo: TipoCategoria;
          nome: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categorias"]["Insert"]>;
        Relationships: [];
      };
      produtos: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          descricao: string | null;
          preco_venda: number | null;
          preco_custo: number | null;
          categoria: string | null;
          codigo_barras: string | null;
          quantidade_estoque: number;
          quantidade_minima: number;
          ativo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          descricao?: string | null;
          preco_venda?: number | null;
          preco_custo?: number | null;
          categoria?: string | null;
          codigo_barras?: string | null;
          quantidade_estoque?: number;
          quantidade_minima?: number;
          ativo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["produtos"]["Insert"]>;
        Relationships: [];
      };
      movimentacoes_estoque: {
        Row: {
          id: string;
          empresa_id: string;
          produto_id: string;
          tipo: TipoMovimentacaoEstoque;
          quantidade: number;
          motivo: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          produto_id: string;
          tipo: TipoMovimentacaoEstoque;
          quantidade: number;
          motivo?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["movimentacoes_estoque"]["Insert"]
        >;
        Relationships: [];
      };
      fornecedores: {
        Row: {
          id: string;
          empresa_id: string;
          nome: string;
          telefone: string | null;
          email: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome: string;
          telefone?: string | null;
          email?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["fornecedores"]["Insert"]
        >;
        Relationships: [];
      };
      compras: {
        Row: {
          id: string;
          empresa_id: string;
          fornecedor_id: string | null;
          data: string;
          valor_total: number;
          observacoes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          fornecedor_id?: string | null;
          data?: string;
          valor_total?: number;
          observacoes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["compras"]["Insert"]>;
        Relationships: [];
      };
      compras_itens: {
        Row: {
          id: string;
          compra_id: string;
          produto_id: string;
          quantidade: number;
          preco_unitario: number;
        };
        Insert: {
          id?: string;
          compra_id: string;
          produto_id: string;
          quantidade: number;
          preco_unitario?: number;
        };
        Update: Partial<
          Database["public"]["Tables"]["compras_itens"]["Insert"]
        >;
        Relationships: [];
      };
      auth_rate_limit: {
        Row: {
          id: string;
          tipo: "login" | "cadastro";
          identificador: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tipo: "login" | "cadastro";
          identificador: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["auth_rate_limit"]["Insert"]
        >;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          empresa_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["push_subscriptions"]["Insert"]
        >;
        Relationships: [];
      };
      assinaturas: {
        Row: {
          id: string;
          empresa_id: string;
          status: StatusAssinatura;
          plano: PlanoAssinatura;
          valor_mensal: number;
          trial_inicio: string | null;
          trial_fim: string | null;
          proxima_cobranca: string | null;
          mp_subscription_id: string | null;
          mp_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          status?: StatusAssinatura;
          plano?: PlanoAssinatura;
          valor_mensal?: number;
          trial_inicio?: string | null;
          trial_fim?: string | null;
          proxima_cobranca?: string | null;
          mp_subscription_id?: string | null;
          mp_customer_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["assinaturas"]["Insert"]
        >;
        Relationships: [];
      };
      pagamentos: {
        Row: {
          id: string;
          empresa_id: string;
          assinatura_id: string;
          valor: number;
          status: StatusPagamentoMP;
          forma_pagamento: FormaPagamentoMP;
          mp_payment_id: string | null;
          mp_status: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          assinatura_id: string;
          valor: number;
          status?: StatusPagamentoMP;
          forma_pagamento: FormaPagamentoMP;
          mp_payment_id?: string | null;
          mp_status?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["pagamentos"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      user_owns_empresa: {
        Args: { empresa_id: string };
        Returns: boolean;
      };
      seed_categorias_padrao: {
        Args: { p_empresa_id: string; p_tipo_negocio: string | null };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
