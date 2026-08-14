-- Recria a view do painel incluindo o estado de suspensão.
--
-- `create or replace view` não aceita acrescentar colunas no meio nem mudar a
-- lista de saída, então é drop + create. As permissões não sobrevivem a um
-- drop, por isso o revoke/grant é repetido no fim — sem ele a view nasceria
-- legível por qualquer usuária logada.
drop view if exists public.admin_contas;

create view public.admin_contas as
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
  e.suspensa_em,
  e.suspensa_motivo,
  e.created_at            as entrou_em,
  u.last_sign_in_at       as ultimo_acesso,
  coalesce(s.status, 'sem_assinatura') as status_assinatura,
  s.plano,
  s.valor_mensal,
  s.trial_fim,
  s.proxima_cobranca,
  case
    when s.status = 'trial' and s.trial_fim is not null
      then ceil(extract(epoch from (s.trial_fim - now())) / 86400)::integer
    else null
  end as dias_restantes_trial
from public.empresas e
join auth.users u on u.id = e.user_id
left join public.assinaturas s on s.empresa_id = e.id;

comment on view public.admin_contas is
  'Visão do painel admin: dados da DONA da conta e da assinatura. Nunca expõe dados dos clientes dela. Acesso só via service role (ver revoke abaixo).';

revoke all on public.admin_contas from anon, authenticated;
grant select on public.admin_contas to service_role;
