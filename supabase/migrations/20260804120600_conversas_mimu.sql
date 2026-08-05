-- Tabela: conversas_mimu
-- Histórico de mensagens trocadas com a assistente de IA (Claude) por empresa.

create table public.conversas_mimu (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

comment on table public.conversas_mimu is 'Histórico de mensagens do chat com a assistente Mimu (Claude).';

create index conversas_mimu_empresa_id_idx on public.conversas_mimu (empresa_id, created_at);

alter table public.conversas_mimu enable row level security;

create policy "Usuárias gerenciam conversas da própria empresa"
  on public.conversas_mimu
  for all
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));
