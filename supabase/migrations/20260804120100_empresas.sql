-- Tabela: empresas
-- Cada linha representa o negócio de um microempreendedor (salão, barbearia,
-- mercado, restaurante...) e é o nó raiz de todo o resto do schema.

create table public.empresas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  tipo_negocio text,
  telefone text,
  endereco text,
  logo_url text,
  horario_funcionamento jsonb,
  meta_mensal numeric(12, 2),
  meta_diaria numeric(12, 2),
  modulos_ativos text[] not null default array['financeiro', 'agenda', 'clientes', 'estoque', 'ia'],
  tema text not null default 'claro' check (tema in ('claro', 'escuro')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.empresas is 'Negócio de um microempreendedor — nó raiz de todo o schema da Mimu.';

create index empresas_user_id_idx on public.empresas (user_id);

create trigger set_updated_at
  before update on public.empresas
  for each row
  execute function public.set_updated_at();

alter table public.empresas enable row level security;

create policy "Usuárias gerenciam a própria empresa"
  on public.empresas
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
