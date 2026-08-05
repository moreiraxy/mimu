-- Tabela: agendamentos
-- A FK de transacao_id -> transacoes(id) é adicionada na migration seguinte
-- (20260804120400_transacoes.sql), depois que a tabela transacoes existir —
-- as duas tabelas se referenciam mutuamente.

create table public.agendamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  cliente_id uuid references public.clientes (id) on delete set null,
  titulo text not null,
  descricao text,
  valor_previsto numeric(12, 2),
  data_hora timestamptz not null,
  duracao_minutos integer,
  status text not null default 'pendente'
    check (status in ('confirmado', 'pendente', 'nao_compareceu', 'concluido')),
  pagamento_registrado boolean not null default false,
  transacao_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.agendamentos is 'Agenda de compromissos/serviços de uma empresa.';
comment on column public.agendamentos.transacao_id is 'FK para transacoes(id), adicionada em 20260804120400_transacoes.sql.';

create index agendamentos_empresa_id_idx on public.agendamentos (empresa_id);
create index agendamentos_cliente_id_idx on public.agendamentos (cliente_id);
create index agendamentos_data_hora_idx on public.agendamentos (data_hora);
create index agendamentos_status_idx on public.agendamentos (empresa_id, status);

create trigger set_updated_at
  before update on public.agendamentos
  for each row
  execute function public.set_updated_at();

alter table public.agendamentos enable row level security;

create policy "Usuárias gerenciam agendamentos da própria empresa"
  on public.agendamentos
  for all
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));
