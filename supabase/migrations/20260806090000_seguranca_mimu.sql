-- Novo tipo de alerta: tentativa de manipular a Mimu (prompt injection) —
-- gerado direto pela rota de chat quando `filtrarMensagem` bloqueia uma
-- mensagem, antes de qualquer chamada à IA.

alter table public.alertas_mimu
  drop constraint alertas_mimu_tipo_check;

alter table public.alertas_mimu
  add constraint alertas_mimu_tipo_check
  check (tipo in (
    'sem_venda',
    'agendamento_pendente',
    'conta_vencida',
    'meta_risco',
    'recorde',
    'cliente_sumiu',
    'estoque_baixo',
    'tentativa_prompt_injection'
  ));
