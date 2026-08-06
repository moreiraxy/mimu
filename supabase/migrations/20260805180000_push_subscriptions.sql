-- Tabela: push_subscriptions
-- Uma linha por dispositivo/navegador inscrito em push notifications reais
-- (Web Push API + VAPID). endpoint é único por inscrição do browser.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

comment on table public.push_subscriptions is 'Inscrições de push notification (Web Push + VAPID) por dispositivo/navegador.';

create index push_subscriptions_empresa_id_idx on public.push_subscriptions (empresa_id);

alter table public.push_subscriptions enable row level security;

create policy "Usuárias gerenciam as próprias inscrições de push"
  on public.push_subscriptions
  for all
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));
