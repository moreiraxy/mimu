-- Devolve a view ao modo definer, e acrescenta a periodicidade.
--
-- Eu a recriei com `security_invoker = true` ao acrescentar a coluna, e isso
-- repetiu um erro que este repositório já tinha cometido e documentado em
-- 20260813181000: com invoker, quem consulta precisa de SELECT em auth.users, e
-- a service_role não tem. Toda leitura passou a responder "permission denied
-- for table users", e o painel admin carregava vazio.
--
-- As duas saídas continuam as mesmas de antes, e a escolha também:
--   a) dar SELECT em auth.users para a service_role abriria a tabela de
--      autenticação inteira (hash de senha, tokens) para qualquer código que
--      use essa chave.
--   b) deixar a view no padrão (definer, dona = postgres), que lê auth.users e
--      expõe SÓ as colunas escolhidas.
--
-- O controle de acesso aqui é o REVOKE, não o invoker.
drop view if exists public.admin_contas;

create view public.admin_contas as
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

comment on view public.admin_contas is
  'Visão do painel admin: dados da DONA da conta e da assinatura. Nunca expõe dados dos clientes dela. Acesso só via service role (ver revoke abaixo).';

-- Repetido depois do drop de propósito: drop descarta os grants junto, e sem
-- estas duas linhas a view nasce sem permissão para o servidor e aberta para
-- quem não deveria.
revoke all on public.admin_contas from anon, authenticated;
grant select on public.admin_contas to service_role;
