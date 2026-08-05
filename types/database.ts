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
  | "recorde";

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
          data: string;
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
          data: string;
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
          lido: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          tipo: TipoAlerta;
          mensagem?: string | null;
          lido?: boolean;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["alertas_mimu"]["Insert"]
        >;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      user_owns_empresa: {
        Args: { empresa_id: string };
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
