-- Tabela: auth_rate_limit
-- Rastreia tentativas de login (por e-mail) e cadastro (por IP) pra impor
-- limites por hora. Não pertence a nenhuma empresa (roda antes de existir
-- sessão) — só é acessada pelo servidor via service role, nunca pelo
-- cliente, então RLS fica ativo sem nenhuma policy (nega tudo por padrão;
-- a service role ignora RLS de qualquer forma).

create table public.auth_rate_limit (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('login', 'cadastro')),
  identificador text not null,
  created_at timestamptz not null default now()
);

comment on table public.auth_rate_limit is 'Tentativas de login/cadastro, pra impor limite por hora (e-mail ou IP). Só acessível via service role.';

create index auth_rate_limit_lookup_idx
  on public.auth_rate_limit (tipo, identificador, created_at desc);

-- Usado pela limpeza oportunista em lib/rate-limit.ts (apaga tentativas
-- com mais de 24h a cada nova tentativa registrada, sem precisar de cron).
create index auth_rate_limit_created_at_idx on public.auth_rate_limit (created_at);

alter table public.auth_rate_limit enable row level security;
