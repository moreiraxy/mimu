import type { Database } from "@/types/database";

export type Empresa = Database["public"]["Tables"]["empresas"]["Row"];
export type Cliente = Database["public"]["Tables"]["clientes"]["Row"];
export type Agendamento = Database["public"]["Tables"]["agendamentos"]["Row"];
export type Transacao = Database["public"]["Tables"]["transacoes"]["Row"];
export type Meta = Database["public"]["Tables"]["metas"]["Row"];
export type ConversaMimu =
  Database["public"]["Tables"]["conversas_mimu"]["Row"];
export type AlertaMimu = Database["public"]["Tables"]["alertas_mimu"]["Row"];

export type {
  FormaPagamento,
  RoleConversa,
  StatusAgendamento,
  Tema,
  TipoAlerta,
  TipoTransacao,
} from "@/types/database";
