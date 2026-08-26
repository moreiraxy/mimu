-- A view do painel passa a expor a periodicidade da assinatura.
--
-- Sem ela, o painel somava `valor_mensal` de todo mundo para mostrar a receita
-- mensal. Desde que o anual existe, essa coluna guarda o valor COBRADO, que
-- numa anual é o do ano inteiro: uma venda de R$ 399 aparecia como R$ 399 por
-- mês. Com três contas, o painel mostrava R$ 438 de receita mensal quando o
-- real era R$ 72.
--
-- A view é recriada inteira porque `create or replace view` não aceita
-- acrescentar coluna no meio. As colunas antigas seguem na mesma ordem.
drop view if exists public.admin_contas;

create view public.admin_contas
with (security_invoker = true)
as
select
  e.id as empresa_id,
  e.user_id,
  u.email,
  e.nome as nome_negocio,
  e.tipo_negocio,
  e.telefone,
  e.endereco,
  e.onboarding_concluido,
  e.modulos_ativos,
  e.suspensa_em,
  e.suspensa_motivo,
  e.created_at as entrou_em,
  u.last_sign_in_at as ultimo_acesso,
  coalesce(a.status, 'sem_assinatura') as status_assinatura,
  a.plano,
  a.valor_mensal,
  a.periodicidade,
  a.trial_fim,
  a.proxima_cobranca,
  case
    when a.status = 'trial' and a.trial_fim is not null
      then greatest(0, date_part('day', a.trial_fim - now())::int)
    else null
  end as dias_restantes_trial
from public.empresas e
join auth.users u on u.id = e.user_id
left join public.assinaturas a on a.empresa_id = e.id;

-- Só o servidor lê: a view junta dados de auth.users e de todas as empresas.
revoke all on public.admin_contas from anon, authenticated;
