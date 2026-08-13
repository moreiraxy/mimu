-- Fase 3: log de auditoria das ações do painel admin.
--
-- Toda alteração feita POR um admin EM uma conta de cliente fica registrada
-- aqui. O motivo é simples: mexer nos módulos de outra pessoa muda o que ela
-- enxerga no app. Sem registro, ninguém consegue responder depois "quem tirou
-- o financeiro dessa conta e quando" — nem a própria dona do produto.
--
-- Guarda o antes e o depois (não só o depois) porque o valor da auditoria
-- está em conseguir reconstruir o que mudou, e desfazer se preciso.
create table public.admin_auditoria (
  id uuid primary key default gen_random_uuid(),
  -- Quem fez. Sem `on delete cascade` de propósito: se a conta do admin for
  -- removida, o registro do que ele fez precisa sobreviver — auditoria que
  -- some junto com o autor não serve pra nada.
  admin_user_id uuid references auth.users (id) on delete set null,
  admin_email text,
  -- Em quem. Também sem cascade: se a empresa for apagada, continua valendo
  -- saber que houve uma alteração nela.
  empresa_id uuid,
  empresa_nome text,
  acao text not null,
  valor_antes jsonb,
  valor_depois jsonb,
  created_at timestamptz not null default now()
);

comment on table public.admin_auditoria is
  'Ações do painel admin sobre contas de clientes. Só acessível via service role.';

create index admin_auditoria_created_at_idx
  on public.admin_auditoria (created_at desc);

create index admin_auditoria_empresa_idx
  on public.admin_auditoria (empresa_id, created_at desc);

-- Mesmo padrão de `admins` e `auth_rate_limit`: RLS ativo e nenhuma policy,
-- então nem anon nem authenticated leem ou escrevem. Só a service role.
alter table public.admin_auditoria enable row level security;
