-- Suporte a alertas proativos da Mimu:
-- 1. transacoes ganha vencimento/status de pagamento, para o alerta de
--    "conta vencida" (a tabela só guardava lançamentos já realizados até aqui).
-- 2. alertas_mimu ganha "metadata" (mesmo padrão de conversas_mimu) pra guardar
--    referências como o id da transação ou do cliente por trás do alerta, e
--    o tipo "cliente_sumiu" entra na lista permitida.

alter table public.transacoes
  add column data_vencimento date,
  add column status_pagamento text not null default 'pago'
    check (status_pagamento in ('pendente', 'pago'));

comment on column public.transacoes.data_vencimento is 'Só relevante para saídas lançadas como pendentes — usado pelo alerta de conta vencida.';
comment on column public.transacoes.status_pagamento is 'Lançamentos existentes continuam "pago" (já são movimentações realizadas); "pendente" é para contas a pagar ainda em aberto.';

create index transacoes_pendentes_idx
  on public.transacoes (empresa_id, data_vencimento)
  where status_pagamento = 'pendente';

alter table public.alertas_mimu
  add column metadata jsonb;

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
    'cliente_sumiu'
  ));
