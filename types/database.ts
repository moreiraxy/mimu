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
// "pendente": escolheu um plano pago e ainda não pagou. Ver a migration
// 20260814030000_assinatura_pendente.sql para o porquê de ser um estado
// próprio e não um reaproveitamento de "cancelada".
export type StatusAssinatura =
  | "trial"
  | "ativa"
  | "cancelada"
  | "vencida"
  | "pendente";
// Os planos pagos vivem em lib/planos.ts, que é a fonte do preço. "completo"
// é o nome antigo, mantido porque contas criadas antes desta mudança já
// gravaram esse valor.
export type PlanoAssinatura = "basico" | "completo" | "pro" | "premium";
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
          suspensa_em: string | null;
          suspensa_motivo: string | null;
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
          suspensa_em?: string | null;
          suspensa_motivo?: string | null;
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
      admin_auditoria: {
        Row: {
          id: string;
          admin_user_id: string | null;
          admin_email: string | null;
          empresa_id: string | null;
          empresa_nome: string | null;
          acao: string;
          valor_antes: Json;
          valor_depois: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id?: string | null;
          admin_email?: string | null;
          empresa_id?: string | null;
          empresa_nome?: string | null;
          acao: string;
          valor_antes?: Json;
          valor_depois?: Json;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_auditoria"]["Insert"]>;
        Relationships: [];
      };
      admins: {
        Row: {
          user_id: string;
          observacao: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          observacao?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admins"]["Insert"]>;
        Relationships: [];
      };
      cancelamentos: {
        Row: {
          id: string;
          empresa_id: string;
          nome_negocio: string | null;
          tipo_negocio: string | null;
          plano: string | null;
          status_assinatura: string | null;
          entrou_em: string | null;
          cancelado_em: string;
          dias_de_casa: number | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          nome_negocio?: string | null;
          tipo_negocio?: string | null;
          plano?: string | null;
          status_assinatura?: string | null;
          entrou_em?: string | null;
          cancelado_em?: string;
          dias_de_casa?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["cancelamentos"]["Insert"]>;
        Relationships: [];
      };
      auth_rate_limit: {
        Row: {
          id: string;
          tipo: "login" | "cadastro" | "chat_ia";
          identificador: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tipo: "login" | "cadastro" | "chat_ia";
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
    Views: {
      // View do painel admin — só leitura, e só pela service role.
      // Expõe dados da DONA da conta; nunca dados dos clientes dela.
      admin_contas: {
        Row: {
          empresa_id: string;
          user_id: string;
          email: string | null;
          nome_negocio: string;
          tipo_negocio: string | null;
          telefone: string | null;
          endereco: string | null;
          onboarding_concluido: boolean;
          modulos_ativos: string[];
          suspensa_em: string | null;
          suspensa_motivo: string | null;
          entrou_em: string;
          ultimo_acesso: string | null;
          status_assinatura: string;
          plano: string | null;
          valor_mensal: number | null;
          trial_fim: string | null;
          proxima_cobranca: string | null;
          dias_restantes_trial: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      user_owns_empresa: {
        Args: { empresa_id: string };
        Returns: boolean;
      };
      seed_categorias_padrao: {
        Args: { p_empresa_id: string; p_tipo_negocio: string | null };
        Returns: undefined;
      };
      /** Devolve o segredo da tarefa diária, criando um se ainda não houver. */
      obter_segredo_cron: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
