import { createServiceClient } from "@/lib/supabase/service";
import type { Json } from "@/types/database";

/**
 * Registra o que acontece no produto, para o painel admin conseguir mostrar.
 *
 * Nasceu de três apagões que ninguém viu acontecer: o cadastro quebrado por
 * três dias, a Mimu muda por horas depois que a Groq aposentou o modelo, e o
 * aviso de novo cadastro que nunca chegou. Nos três casos o erro existia e
 * morria no log do servidor.
 *
 * Duas regras valem para tudo aqui.
 *
 * A primeira: registrar NUNCA pode derrubar o que estava acontecendo. Se
 * gravar o evento falhar, o cadastro, o login e a resposta da Mimu seguem
 * normalmente. Trocar um cliente por uma linha de log seria absurdo.
 *
 * A segunda: nada de senha, token ou conteúdo de conversa. O que serve aqui é
 * o motivo da falha e o suficiente para reencontrar o caso depois.
 */

export type TipoEvento =
  | "cadastro"
  | "cadastro_falhou"
  | "login"
  | "login_falhou"
  | "email_confirmado"
  | "mimu_respondeu"
  | "mimu_falhou"
  | "push_falhou"
  | "alertas_falharam"
  | "venda_manual"
  // A Cakto não reenvia notificação: qualquer resposta nossa é lida como
  // entrega bem sucedida. Sem esta trilha, uma venda que não liberou não
  // deixaria rastro nenhum de que chegou a existir.
  | "cakto_webhook"
  | "cakto_venda"
  | "cakto_venda_falhou"
  | "cakto_reversao"
  | "cakto_reversao_falhou"
  | "cakto_atencao"
  // A pessoa apagou a própria conta pela tela de Minha Empresa. Fica como
  // evento porque a linha da empresa some no instante seguinte: sem isto, o
  // painel admin veria uma conta desaparecer sem nenhum rastro de que houve
  // uma decisão, e não uma falha.
  | "conta_excluida_pelo_usuario"
  // O canal do WhatsApp caiu ou voltou. Sem estes, uma queda de madrugada
  // deixa a Mimu muda até alguém reparar sozinho — que é o apagão silencioso
  // que a tabela de eventos existe para acabar.
  | "whatsapp_caiu"
  | "whatsapp_conectou"
  // Recorrência do Mercado Pago. Sem estes, uma cobrança que passa (ou que
  // deixa de passar) não deixa rastro nenhum — e o sintoma seria alguém
  // pagando e perdendo o acesso, descoberto só pela reclamação.
  | "mp_cobranca_recorrente"
  | "mp_assinatura_encerrada"
  | "mp_assinatura_sem_dono";

export interface DadosEvento {
  empresaId?: string | null;
  userId?: string | null;
  /** Só motivo e contexto. Nunca segredo, nunca texto de mensagem. */
  detalhe?: Record<string, unknown>;
}

export async function registrarEvento(
  tipo: TipoEvento,
  dados: DadosEvento = {},
): Promise<void> {
  try {
    await createServiceClient().from("eventos").insert({
      tipo,
      empresa_id: dados.empresaId ?? null,
      user_id: dados.userId ?? null,
      // O detalhe passa por JSON antes de entrar: além de satisfazer o tipo
      // da coluna, isso derruba função, undefined e referência circular que
      // alguém venha a passar sem querer, em vez de estourar na inserção.
      detalhe: (dados.detalhe
        ? (JSON.parse(JSON.stringify(dados.detalhe)) as Json)
        : null),
    });
  } catch (erro) {
    // Nem o console pode ficar barulhento demais: se o banco estiver fora, a
    // pessoa já tem problema maior do que um evento perdido.
    console.error("Não consegui registrar o evento.", tipo, erro);
  }
}
