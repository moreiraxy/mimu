-- Tabela: metas
-- Meta financeira mensal de uma empresa e o quanto foi realizado.

create table public.metas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  mes integer not null check (mes between 1 and 12),
  ano integer not null check (ano >= 2000),
  valor_meta numeric(12, 2),
  valor_realizado numeric(12, 2) not null default 0,
  bateu_meta boolean not null default false,
  recorde boolean not null default false,
  created_at timestamptz not null default now(),
  unique (empresa_id, mes, ano)
);

comment on table public.metas is 'Meta financeira mensal de uma empresa.';

create index metas_empresa_id_idx on public.metas (empresa_id);

alter table public.metas enable row level security;

create policy "Usuárias gerenciam metas da própria empresa"
  on public.metas
  for all
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));
