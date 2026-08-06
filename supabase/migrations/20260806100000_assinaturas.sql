-- Sistema de assinatura da Mimu (Mercado Pago, checkout transparente).
-- assinaturas: uma por empresa. pagamentos: histórico de cobranças (Pix e
-- cartão) ligadas a uma assinatura.

create table public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null unique references public.empresas (id) on delete cascade,
  status text not null default 'trial'
    check (status in ('trial', 'ativa', 'cancelada', 'vencida')),
  plano text not null default 'completo'
    check (plano in ('basico', 'completo')),
  valor_mensal numeric(12, 2) not null default 39,
  trial_inicio timestamptz,
  trial_fim timestamptz,
  proxima_cobranca timestamptz,
  mp_subscription_id text,
  mp_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.assinaturas is 'Assinatura da Mimu por empresa — trial de 14 dias, depois R$39/mês via Mercado Pago.';

create index assinaturas_empresa_id_idx on public.assinaturas (empresa_id);

create trigger set_updated_at
  before update on public.assinaturas
  for each row
  execute function public.set_updated_at();

alter table public.assinaturas enable row level security;

create policy "Usuárias gerenciam a própria assinatura"
  on public.assinaturas
  for all
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));

-- Pagamentos (histórico de cobranças Pix/cartão) ligados a uma assinatura.

create table public.pagamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  assinatura_id uuid not null references public.assinaturas (id) on delete cascade,
  valor numeric(12, 2) not null,
  status text not null default 'pendente'
    check (status in ('pendente', 'aprovado', 'recusado', 'reembolsado')),
  forma_pagamento text not null check (forma_pagamento in ('pix', 'cartao')),
  mp_payment_id text,
  mp_status text,
  created_at timestamptz not null default now()
);

comment on table public.pagamentos is 'Histórico de cobranças (Pix/cartão) da assinatura de uma empresa.';

create index pagamentos_empresa_id_idx on public.pagamentos (empresa_id, created_at desc);
create index pagamentos_assinatura_id_idx on public.pagamentos (assinatura_id);
-- Usado pelo webhook pra achar o pagamento a partir do id que o Mercado
-- Pago manda na notificação — precisa ser rápido e único.
create unique index pagamentos_mp_payment_id_idx on public.pagamentos (mp_payment_id)
  where mp_payment_id is not null;

alter table public.pagamentos enable row level security;

create policy "Usuárias gerenciam os próprios pagamentos"
  on public.pagamentos
  for all
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));

-- Backfill: empresas que já existiam antes desse sistema de assinatura
-- ganham um trial de 14 dias a partir de agora, em vez de serem trancadas
-- pro /assinar sem nunca terem tido um período gratuito.
do $$
declare
  empresa record;
begin
  for empresa in select id from public.empresas loop
    insert into public.assinaturas (empresa_id, status, trial_inicio, trial_fim)
    values (empresa.id, 'trial', now(), now() + interval '14 days')
    on conflict (empresa_id) do nothing;
  end loop;
end $$;
