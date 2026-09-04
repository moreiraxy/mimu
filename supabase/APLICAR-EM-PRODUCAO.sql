-- ============================================================================
-- MIMU — a migration pendente: push do aplicativo iOS
-- ============================================================================
--
-- Para rodar SEM instalar nada: abra o SQL Editor do Supabase, cole este
-- arquivo inteiro e execute.
--
--   https://supabase.com/dashboard/project/yzebafhugbctcdomtxry/sql/new
--
-- Corresponde a supabase/migrations/20260904190000_push_apns.sql, já aplicada
-- e conferida no banco local.
--
-- RODE ISTO ANTES DE O CÓDIGO NOVO SUBIR, e desta vez a ordem é menos dramática
-- do que da última: o `lib/push.ts` novo GRAVA a coluna `tipo` a cada inscrição
-- de push. Num banco sem ela, quem aceitar receber notificação recebe erro 500
-- e não fica inscrito. O que já está inscrito continua funcionando — a leitura
-- degrada sozinha, porque `tipo` ausente cai no caminho web, que é o de hoje.
--
-- TUDO OU NADA. Roda dentro de uma transação: se qualquer comando falhar, o
-- Postgres desfaz o resto sozinho e o banco fica exatamente como estava.
--
-- O QUE ELE MEXE EM DADO DE CLIENTE: nada. Nenhum UPDATE, nenhum DELETE. Só
-- acrescenta uma coluna com valor padrão e afrouxa duas obrigatoriedades.
--
-- POR QUE É BARATO MESMO COM A TABELA CHEIA: `add column ... default` não
-- reescreve a tabela desde o Postgres 11 — o padrão fica no catálogo. O
-- `drop not null` é instantâneo. Só o `check` novo varre as linhas existentes,
-- e push_subscriptions tem uma linha por aparelho inscrito.
--
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 20260904190000 — dois transportes de push na mesma tabela
-- ----------------------------------------------------------------------------
--
-- O Web Push não funciona dentro do aplicativo: a WKWebView não expõe
-- `PushManager`, e a inscrição nem chega a ser criada. Quem abre pelo Safari
-- continua no caminho de sempre; quem abre pelo app precisa do APNs, que usa
-- um token de aparelho e não tem par de chaves.
--
-- Uma tabela só, e não duas, porque quem dispara um alerta quer avisar A
-- EMPRESA — não "os navegadores e depois os iPhones dela". Com tabelas
-- separadas, cada consumidor precisaria lembrar das duas, e no dia que alguém
-- esquecesse metade das pessoas não receberia nada, sem erro em lugar nenhum.

do $$
begin
  if not exists (
    select 1 from information_schema.columns
     where table_schema = 'public'
       and table_name = 'push_subscriptions'
       and column_name = 'tipo'
  ) then
    alter table public.push_subscriptions
      add column tipo text not null default 'web'
      check (tipo in ('web', 'apns'));
  end if;
end $$;

-- Deixam de ser obrigatórias porque o APNs não tem par de chaves. A coerência
-- não some: volta abaixo, por transporte.
alter table public.push_subscriptions alter column p256dh drop not null;
alter table public.push_subscriptions alter column auth drop not null;

-- Inscrição web SEM as chaves é inútil — o envio falharia na hora de cifrar.
-- Melhor recusar na gravação do que descobrir no alerta que não chegou.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'push_subscriptions_web_exige_chaves'
  ) then
    alter table public.push_subscriptions
      add constraint push_subscriptions_web_exige_chaves
      check (tipo <> 'web' or (p256dh is not null and auth is not null));
  end if;
end $$;

comment on column public.push_subscriptions.tipo is
  'Transporte: web (Web Push + VAPID) ou apns (aplicativo iOS). Define como endpoint é lido.';

comment on table public.push_subscriptions is
  'Inscrições de push por dispositivo. Web Push (navegador) e APNs (app iOS) na mesma tabela.';

commit;

-- ============================================================================
-- CONFERÊNCIA — rode depois, e leia o resultado
-- ============================================================================
--
-- select column_name, is_nullable, column_default
--   from information_schema.columns
--  where table_schema = 'public' and table_name = 'push_subscriptions'
--    and column_name in ('tipo', 'p256dh', 'auth');
--
--   -> tipo    NO   'web'::text
--   -> p256dh  YES
--   -> auth    YES
--
-- select conname from pg_constraint
--  where conname = 'push_subscriptions_web_exige_chaves';
--
--   -> tem que devolver uma linha
--
-- select tipo, count(*) from public.push_subscriptions group by tipo;
--
--   -> tudo que já existia vira 'web', que é o que essas linhas sempre foram
