-- Campos necessários para o onboarding de 3 passos.

alter table public.empresas
  add column onboarding_concluido boolean not null default false,
  add column clientes_por_semana_media integer;

comment on column public.empresas.onboarding_concluido is
  'True quando o onboarding de 3 passos foi concluído (ou pulado no passo da meta).';
comment on column public.empresas.clientes_por_semana_media is
  'Média de clientes atendidos por semana, informada no onboarding.';

-- Nenhum módulo deve começar "ativo" por padrão: a seleção acontece no
-- passo 2 do onboarding, não no momento do cadastro.
alter table public.empresas
  alter column modulos_ativos set default '{}';
