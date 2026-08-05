-- Tabela: alertas_mimu
-- Notificações proativas da Mimu (venda parada, agendamento pendente, conta
-- vencida, meta em risco, recorde batido).

create table public.alertas_mimu (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  tipo text not null
    check (tipo in ('sem_venda', 'agendamento_pendente', 'conta_vencida', 'meta_risco', 'recorde')),
  mensagem text,
  lido boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.alertas_mimu is 'Alertas e notificações proativas geradas pela Mimu.';

create index alertas_mimu_empresa_id_idx on public.alertas_mimu (empresa_id, lido);

alter table public.alertas_mimu enable row level security;

create policy "Usuárias gerenciam alertas da própria empresa"
  on public.alertas_mimu
  for all
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));
