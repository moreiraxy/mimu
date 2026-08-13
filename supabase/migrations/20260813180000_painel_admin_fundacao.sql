-- Fase 1 do painel admin: quem é admin, o que o admin pode ver, e registro
-- de quem saiu. Nenhuma tela ainda — só a fundação de segurança.

-- ---------------------------------------------------------------------------
-- 1) Quem é admin
-- ---------------------------------------------------------------------------
-- Mora numa tabela própria, NÃO em user_metadata: em vários fluxos do Supabase
-- a própria usuária consegue escrever no seu user_metadata via updateUser(),
-- o que deixaria qualquer pessoa se promover a admin.
--
-- Também não vai em app_metadata (que seria seguro de escrever, só service
-- role): app_metadata viaja dentro do JWT, então revogar um admin só teria
-- efeito quando o token dela expirasse. Numa tabela, a checagem é feita do
-- zero a cada requisição e a revogação vale na hora.
--
-- RLS ligado e NENHUMA policy: nega tudo por padrão para anon/authenticated —
-- ninguém consegue nem descobrir quem é admin. A service role ignora RLS, e é
-- só por ela (lib/admin.ts, no servidor) que essa tabela é lida.
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  observacao text,
  created_at timestamptz not null default now()
);

comment on table public.admins is
  'Contas com acesso ao painel admin. Só acessível via service role — RLS ativo sem policies nega todo acesso pelo cliente.';

alter table public.admins enable row level security;

-- ---------------------------------------------------------------------------
-- 2) Registro de quem saiu
-- ---------------------------------------------------------------------------
-- Hoje tudo é `on delete cascade` a partir de auth.users: quando uma conta é
-- apagada, não sobra rastro de que ela existiu. Esta tabela guarda o mínimo
-- para responder "quem saiu e quando", preenchida por trigger ANTES da linha
-- sumir.
--
-- De propósito NÃO guarda e-mail, telefone nem endereço: se a saída foi um
-- pedido de exclusão de dados (LGPD), manter o contato da pessoa depois de
-- apagar a conta contraria o próprio pedido. O que fica é métrica de negócio
-- (que tipo de negócio era, quanto tempo ficou, em que plano), que é
-- registro legítimo e não identifica ninguém.
create table public.cancelamentos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  nome_negocio text,
  tipo_negocio text,
  plano text,
  status_assinatura text,
  entrou_em timestamptz,
  cancelado_em timestamptz not null default now(),
  dias_de_casa integer
);

comment on table public.cancelamentos is
  'Rastro de contas encerradas, para métricas de saída. Sem dados de contato de propósito (ver comentário na migration).';

create index cancelamentos_cancelado_em_idx
  on public.cancelamentos (cancelado_em desc);

alter table public.cancelamentos enable row level security;

-- Dispara na exclusão da empresa — inclusive quando ela vem em cascata a
-- partir de auth.users. No momento do BEFORE DELETE a linha de assinaturas
-- ainda existe (ela referencia empresas, então só é removida depois), por
-- isso dá para ler plano e status aqui.
create or replace function public.registrar_cancelamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a record;
begin
  select plano, status into a
  from public.assinaturas
  where empresa_id = old.id;

  insert into public.cancelamentos (
    empresa_id, nome_negocio, tipo_negocio, plano, status_assinatura,
    entrou_em, dias_de_casa
  )
  values (
    old.id, old.nome, old.tipo_negocio, a.plano, a.status,
    old.created_at,
    greatest(0, extract(day from (now() - old.created_at))::integer)
  );

  return old;
end;
$$;

create trigger on_empresa_deleted
  before delete on public.empresas
  for each row
  execute function public.registrar_cancelamento();

-- ---------------------------------------------------------------------------
-- 3) O que o admin pode ver
-- ---------------------------------------------------------------------------
-- A fronteira de confidencialidade é estrutural, não por disciplina: o painel
-- lê SÓ desta view. As tabelas com dados dos clientes da usuária (clientes,
-- transacoes, agendamentos, conversas_mimu, produtos, metas) não aparecem
-- aqui — então nem um bug no painel consegue vazá-las, porque as colunas não
-- existem no que ele enxerga.
--
-- `security_invoker = true` é defesa em profundidade: se um dia esta view
-- escapar para o cliente, o RLS das tabelas de baixo ainda vale e a pessoa só
-- veria a própria linha. A service role ignora RLS, então o painel segue
-- vendo todo mundo.
create view public.admin_contas
with (security_invoker = true) as
select
  e.id                    as empresa_id,
  e.user_id,
  u.email,
  e.nome                  as nome_negocio,
  e.tipo_negocio,
  e.telefone,
  e.endereco,
  e.onboarding_concluido,
  e.modulos_ativos,
  e.created_at            as entrou_em,
  u.last_sign_in_at       as ultimo_acesso,
  coalesce(s.status, 'sem_assinatura') as status_assinatura,
  s.plano,
  s.valor_mensal,
  s.trial_fim,
  s.proxima_cobranca,
  -- Dias que faltam no teste grátis. Negativo = já venceu; null = não está
  -- em trial. Calculado aqui para o painel não repetir essa conta.
  case
    when s.status = 'trial' and s.trial_fim is not null
      then ceil(extract(epoch from (s.trial_fim - now())) / 86400)::integer
    else null
  end as dias_restantes_trial
from public.empresas e
join auth.users u on u.id = e.user_id
left join public.assinaturas s on s.empresa_id = e.id;

comment on view public.admin_contas is
  'Visão do painel admin: dados da DONA da conta e da assinatura. Nunca expõe dados dos clientes dela.';

-- Trava de acesso: mesmo com o RLS das tabelas de baixo, ninguém além do
-- servidor deve conseguir consultar esta view.
revoke all on public.admin_contas from anon, authenticated;
grant select on public.admin_contas to service_role;
