-- Módulo "Minha Empresa": categorias personalizáveis por empresa, preferências
-- de notificação por horário, e bucket de storage para o logo.

-- ---------------------------------------------------------------------------
-- Categorias (substituem as listas fixas de lib/categories.ts)
-- ---------------------------------------------------------------------------

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas (id) on delete cascade,
  tipo text not null check (tipo in ('entrada', 'saida')),
  nome text not null,
  created_at timestamptz not null default now(),
  unique (empresa_id, tipo, nome)
);

comment on table public.categorias is 'Categorias de entrada/saída personalizáveis por empresa.';

create index categorias_empresa_id_idx on public.categorias (empresa_id, tipo);

alter table public.categorias enable row level security;

create policy "Usuárias gerenciam categorias da própria empresa"
  on public.categorias
  for all
  using (public.user_owns_empresa(empresa_id))
  with check (public.user_owns_empresa(empresa_id));

-- Preenche categorias padrão pra uma empresa, variando por tipo_negocio.
-- Chamada uma vez no onboarding (via rpc, a partir do server action) e no
-- backfill logo abaixo, pras empresas que já existiam antes dessa migration.
-- security definer porque o insert em categorias exige RLS satisfeita, mas o
-- guard de auth.uid() abaixo garante que só quem é dono da empresa (ou o
-- backfill, rodando sem sessão de usuário) pode chamar isso.
create or replace function public.seed_categorias_padrao(
  p_empresa_id uuid,
  p_tipo_negocio text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  entradas text[];
  saidas text[];
begin
  if auth.uid() is not null and not public.user_owns_empresa(p_empresa_id) then
    raise exception 'Não autorizado.';
  end if;

  entradas := case p_tipo_negocio
    when 'salao' then array['Corte', 'Coloração', 'Manicure', 'Produto', 'Outro']
    when 'mercado' then array['Venda balcão', 'Fiado quitado', 'Outro']
    when 'restaurante' then array['Consumo no local', 'Delivery', 'Outro']
    when 'servico' then array['Serviço prestado', 'Produto', 'Outro']
    when 'oficina' then array['Mão de obra', 'Peças', 'Outro']
    else array['Serviço', 'Produto', 'Recebimento', 'Outro']
  end;

  saidas := case p_tipo_negocio
    when 'salao' then array['Aluguel', 'Produtos de beleza', 'Energia', 'Funcionário', 'Outro']
    when 'mercado' then array['Aluguel', 'Fornecedor', 'Energia', 'Funcionário', 'Outro']
    when 'restaurante' then array['Aluguel', 'Ingredientes', 'Energia', 'Funcionário', 'Outro']
    when 'servico' then array['Aluguel', 'Material', 'Transporte', 'Outro']
    when 'oficina' then array['Aluguel', 'Peças', 'Ferramentas', 'Outro']
    else array['Aluguel', 'Fornecedor', 'Energia', 'Produto', 'Funcionário', 'Outro']
  end;

  insert into public.categorias (empresa_id, tipo, nome)
  select p_empresa_id, 'entrada', unnest(entradas)
  on conflict (empresa_id, tipo, nome) do nothing;

  insert into public.categorias (empresa_id, tipo, nome)
  select p_empresa_id, 'saida', unnest(saidas)
  on conflict (empresa_id, tipo, nome) do nothing;
end;
$$;

-- Backfill: empresas que já existiam antes dessa migration.
do $$
declare
  r record;
begin
  for r in select id, tipo_negocio from public.empresas loop
    perform public.seed_categorias_padrao(r.id, r.tipo_negocio);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Preferências de horário/ativo dos alertas configuráveis. Os demais alertas
-- (conta vencida, meta em risco, recorde, cliente sumido) não têm horário
-- configurável — disparam por condição, não por horário fixo.
-- ---------------------------------------------------------------------------

alter table public.empresas
  add column config_alertas jsonb not null default '{
    "sem_venda": {"ativo": true, "hora": 17},
    "agendamento_pendente": {"ativo": true, "hora": 19}
  }'::jsonb;

comment on column public.empresas.config_alertas is 'Horário e ativo/inativo dos alertas configuráveis da Mimu proativa.';

-- ---------------------------------------------------------------------------
-- Storage: logo das empresas
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "Logos são publicamente legíveis"
  on storage.objects for select
  using (bucket_id = 'logos');

create policy "Usuárias sobem logo da própria empresa"
  on storage.objects for insert
  with check (
    bucket_id = 'logos'
    and public.user_owns_empresa((storage.foldername(name))[1]::uuid)
  );

create policy "Usuárias atualizam logo da própria empresa"
  on storage.objects for update
  using (
    bucket_id = 'logos'
    and public.user_owns_empresa((storage.foldername(name))[1]::uuid)
  );

create policy "Usuárias removem logo da própria empresa"
  on storage.objects for delete
  using (
    bucket_id = 'logos'
    and public.user_owns_empresa((storage.foldername(name))[1]::uuid)
  );
