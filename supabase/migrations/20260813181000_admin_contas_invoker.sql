-- Correção da view admin_contas.
--
-- Ela nasceu com `security_invoker = true` como defesa em profundidade, mas
-- isso a quebrou na prática: com invoker, quem consulta precisa ter SELECT em
-- auth.users, e o service_role não tem por padrão no Supabase. O resultado
-- era "permission denied for table users" em toda leitura.
--
-- As duas saídas eram:
--   a) `grant select on auth.users to service_role` — abriria a tabela de
--      autenticação INTEIRA (senha hash, tokens de recuperação, metadata) pra
--      qualquer código que use a service role. Custo alto por um e-mail.
--   b) voltar a view pro padrão (security definer, dona = postgres), que
--      consegue ler auth.users e continua expondo SÓ as colunas escolhidas.
--
-- Escolhida a (b). O controle de acesso aqui é o REVOKE, não o invoker: já
-- foi testado que anon e authenticated levam "permission denied for view
-- admin_contas". A view é a única porta, e ela só serve as colunas da dona da
-- conta — os dados dos clientes dela continuam fora do alcance.

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

-- A trava de verdade: sem isto, uma view security definer seria legível por
-- qualquer usuária logada.
revoke all on public.admin_contas from anon, authenticated;
grant select on public.admin_contas to service_role;
