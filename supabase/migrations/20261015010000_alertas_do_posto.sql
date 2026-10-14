-- Os avisos passam a falar do trabalho dela, e não do caixa de um salão.
--
-- Pergunta dela: "notificaçÕes?? elas estão programadas para irem de acordo
-- com os afazeres taferas agendas e lembretes??" — não estavam. Os seis tipos
-- que existiam são do produto antigo: 'sem_venda', 'agendamento_pendente',
-- 'conta_vencida', 'meta_risco', 'recorde', 'cliente_sumiu', 'estoque_baixo'.
-- Para quem não tem salão, nenhum deles dispara nunca — e o resultado é um
-- aplicativo que pede permissão de notificação e depois nunca avisa nada.
--
-- OS CINCO NOVOS, e por que cada um existe:
--
--   bloco_atrasado   — passou da hora e não foi marcado. É o aviso que a
--                      rotina acordada com o gerente cobra e que ninguém
--                      reclama quando falta: o preço aparece dias depois, num
--                      lead parado na fila de alguém que já foi cortado.
--   prazo_hoje       — pendência com prazo vencendo ou vencido.
--   aprovacao_parada — assunto que depende do Dyego e está em aberto. Esperar
--                      sem cobrar é o jeito mais fácil de uma venda morrer.
--   compromisso_perto— reunião chegando.
--   resumo_pendente  — passou das 17:45 e o resumo do dia não foi enviado.
--   indicador_vazio  — fim do dia com indicador do cargo sem anotação. Não é
--                      cobrança de número ruim: é lembrar de anotar, porque
--                      número não anotado não vira zero, vira silêncio.
--
-- O CHECK é a razão de esta migration existir: sem ela, o insert falha e o
-- alerta simplesmente não nasce — sem erro em tela nenhuma. É o mesmo tropeço
-- da migration 20260831210000, com a cota da Mimu.

alter table public.alertas_mimu
  drop constraint if exists alertas_mimu_tipo_check;

alter table public.alertas_mimu
  add constraint alertas_mimu_tipo_check
  check (tipo in (
    -- Os do produto antigo, intocados: as contas de salão continuam usando.
    'sem_venda',
    'agendamento_pendente',
    'conta_vencida',
    'meta_risco',
    'recorde',
    'cliente_sumiu',
    'estoque_baixo',
    'tentativa_prompt_injection',
    -- Os do Posto de Comando.
    'bloco_atrasado',
    'prazo_hoje',
    'aprovacao_parada',
    'compromisso_perto',
    'resumo_pendente',
    'indicador_vazio'
  ));

comment on column public.alertas_mimu.tipo is
  'Que aviso é. Os seis últimos valores são do Posto de Comando (rotina, prazos, aprovação do gerente, compromisso, resumo do dia e indicador não anotado); os anteriores são do produto de gestão de negócio. Ver lib/posto/alertas.ts e lib/alertas-proativos.ts.';
