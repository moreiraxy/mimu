-- Tabela: transacoes
-- Lançamentos financeiros (entradas e saídas) de uma empresa. Fecha a
-- referência cruzada com agendamentos, criada na migration anterior.

create table public.transacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete set null,
  agendamento_id uuid references public.agendamentos (id) on delete set null,
  tipo text not null check (tipo in ('entrada', 'saida')),
  valor numeric(12, 2) not null,
  descricao text,
  categoria text,
  forma_pagamento text check (forma_pagamento in ('dinheiro', 'pix', 'debito', 'credito')),
  parcelas integer not null default 1,
  parcela_atual integer not null default 1,
  data date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.transacoes is 'Lançamentos financeiros (entradas e saídas) de uma empresa.';

alter table public.agendamentos
  add constraint agendamentos_transacao_id_fkey
  foreign key (transacao_id) references public.transacoes (id) on delete set null;

create index transacoes_empresa_id_idx on public.transacoes (empresa_id);
create index transacoes_cliente_id_idx on public.transacoes (cliente_id);
create index transacoes_agendamento_id_idx on public.transacoes (agendamento_id);
create index transacoes_data_idx on public.transacoes (empresa_id, data);
create index transacoes_tipo_idx on public.transacoes (empresa_id, tipo);

create trigger set_updated_at
  before update on public.transacoes
  for each row
  execute function public.set_updated_at();

alter table public.transacoes enable row level security;

create policy "Usuárias gerenciam transações da própria empresa"
  on public.transacoes
  for all
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));
