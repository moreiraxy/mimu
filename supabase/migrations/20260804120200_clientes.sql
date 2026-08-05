-- Tabela: clientes
-- Clientes de uma empresa. cliente_fiel é recalculado automaticamente por
-- trigger sempre que total_visitas ou total_gasto mudam (ver trigger abaixo).

create table public.clientes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  nome text not null,
  telefone text,
  email text,
  data_nascimento date,
  observacoes text,
  saldo_fiado numeric(12, 2) not null default 0,
  total_gasto numeric(12, 2) not null default 0,
  total_visitas integer not null default 0,
  ultimo_atendimento date,
  frequencia_media_dias integer,
  cliente_fiel boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.clientes is 'Clientes de uma empresa.';

create index clientes_empresa_id_idx on public.clientes (empresa_id);
create index clientes_cliente_fiel_idx on public.clientes (empresa_id, cliente_fiel);

create trigger set_updated_at
  before update on public.clientes
  for each row
  execute function public.set_updated_at();

-- Recalcula cliente_fiel sempre que os contadores mudarem, mantendo a regra
-- de negócio num único lugar em vez de espalhada pela aplicação.
create or replace function public.atualizar_cliente_fiel()
returns trigger
language plpgsql
as $$
begin
  new.cliente_fiel := (new.total_visitas > 10 or new.total_gasto > 1000);
  return new;
end;
$$;

create trigger trg_atualizar_cliente_fiel
  before insert or update of total_visitas, total_gasto on public.clientes
  for each row
  execute function public.atualizar_cliente_fiel();

alter table public.clientes enable row level security;

create policy "Usuárias gerenciam clientes da própria empresa"
  on public.clientes
  for all
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));
