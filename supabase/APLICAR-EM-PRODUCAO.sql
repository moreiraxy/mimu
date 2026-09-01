-- ============================================================================
-- MIMU — as duas migrations pendentes, num arquivo só
-- ============================================================================
--
-- Para rodar SEM instalar nada: abra o SQL Editor do Supabase, cole este
-- arquivo inteiro e execute.
--
--   https://supabase.com/dashboard/project/yzebafhugbctcdomtxry/sql/new
--
-- RODE ISTO ANTES DE O CÓDIGO NOVO SUBIR. Não é recomendação de ordem: a
-- gravação de toda mensagem da Mimu passa a mandar a coluna `canal`, e num
-- banco sem ela o insert é recusado. Sem esta migration, o chat da Mimu para
-- de responder — no app e no WhatsApp.
--
-- TUDO OU NADA. O arquivo roda dentro de uma transação: se qualquer comando
-- falhar, o Postgres desfaz o resto sozinho e o banco fica exatamente como
-- estava. Não existe meio caminho.
--
-- O QUE ELE MEXE EM DADO DE CLIENTE: um único UPDATE, que entrega a assistente
-- às contas gratuitas que já existem. Ele não tira nada de ninguém e não toca
-- em conta paga. Para saber de antemão quantas contas ele alcança:
--
--   select count(*) from public.empresas e
--    where not (e.modulos_ativos @> array['ia'])
--      and exists (select 1 from public.assinaturas a
--                   where a.empresa_id = e.id and a.plano = 'free');
--
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- Trava contra rodar duas vezes
-- ----------------------------------------------------------------------------
--
-- Rodar de novo já seria seguro (a transação desfaz tudo), mas a mensagem de
-- erro pareceria defeito. Isto troca por um aviso que explica.
do $ja_rodou$
begin
  if exists (
    select from information_schema.columns
     where table_schema = 'public'
       and table_name = 'conversas_mimu'
       and column_name = 'canal'
  ) then
    raise exception
      'Estas migrations JA foram aplicadas neste banco. Nada foi alterado.'
      using hint = 'Confira com: select column_name from information_schema.columns where table_name = ''conversas_mimu'';';
  end if;
end
$ja_rodou$;

-- ----------------------------------------------------------------------------
-- Trava contra rodar FORA DE ORDEM
-- ----------------------------------------------------------------------------
--
-- A primeira migration mexe numa constraint de `auth_rate_limit` que só existe
-- depois do lote anterior (o do WhatsApp). Sem esta checagem, o erro seria um
-- "constraint does not exist" que não diz o que fazer.
do $lote_anterior$
begin
  if not exists (
    select from pg_tables
     where schemaname = 'public' and tablename = 'whatsapp_links'
  ) then
    raise exception
      'O lote anterior de migrations (o do WhatsApp) ainda nao foi aplicado.'
      using hint = 'Aplique primeiro aquele arquivo; este depende dele.';
  end if;
end
$lote_anterior$;

-- ============================================================================
-- 20260831210000 — cota diária da Mimu
-- ============================================================================
--
-- `auth_rate_limit.tipo` tem check constraint. Um tipo novo declarado só no
-- TypeScript faz o insert falhar — e falha em SILÊNCIO, porque quem registra a
-- tentativa engole o erro de propósito (o limite não pode derrubar uma resposta
-- da Mimu). O resultado seria a cota nunca subir de zero: toda conta com o dia
-- inteiro livre, para sempre, sem nada no log dizendo isso.

alter table public.auth_rate_limit
  drop constraint if exists auth_rate_limit_tipo_check;

alter table public.auth_rate_limit
  add constraint auth_rate_limit_tipo_check
  check (tipo in ('login', 'cadastro', 'chat_ia', 'recuperar_senha', 'whatsapp_vinculo', 'mimu_dia'));

comment on column public.auth_rate_limit.tipo is
  'Qual teto esta linha conta. ''mimu_dia'' é a cota diária de mensagens da Mimu, identificada pela EMPRESA (e não pelo usuário) porque vale somando app e WhatsApp. Os valores por plano vivem em lib/planos.ts.';

-- As contas gratuitas que já existem precisam RECEBER a assistente.
--
-- O acesso real é a interseção de duas listas: `modulos_ativos`, que é o que a
-- dona escolheu, e o teto do plano. Abrir o teto sem mexer na escolha não muda
-- nada para quem já está aqui — e não muda porque a escolha nunca aconteceu:
-- para uma conta gratuita a Mimu não aparecia na tela de módulos, então não
-- havia como marcá-la. A lista delas diz "não quero" quando na verdade diz
-- "nunca me perguntaram".
--
-- Por isso só as gratuitas. Uma conta paga que tem 'ia' fora da lista fez uma
-- escolha de verdade, num lugar onde a opção estava visível.
update public.empresas e
set modulos_ativos = array_append(e.modulos_ativos, 'ia')
where not (e.modulos_ativos @> array['ia'])
  and exists (
    select 1
    from public.assinaturas a
    where a.empresa_id = e.id
      and a.plano = 'free'
  );

-- ============================================================================
-- 20260901190000 — de onde veio cada mensagem da conversa
-- ============================================================================
--
-- O histórico do chat mistura, na mesma linha do tempo, o que foi digitado no
-- app e o que foi mandado pelo WhatsApp — e é assim que tem que ser: é a mesma
-- Mimu, com a mesma memória. O que faltava era PODER DIZER de onde cada
-- mensagem veio, para a tela de conversas recentes mostrar a origem. A pessoa
-- não lembra de ter falado "com a Mimu"; ela lembra de ter falado no WhatsApp.
--
-- `default 'app'` cobre tudo que já existe: antes desta coluna, o único canal
-- que gravava aqui pelo app era o app.

alter table public.conversas_mimu
  add column if not exists canal text not null default 'app'
  check (canal in ('app', 'whatsapp'));

comment on column public.conversas_mimu.canal is
  'Por onde a mensagem passou. Serve à tela de conversas recentes; a Mimu lê o histórico inteiro independente do canal.';

create index if not exists conversas_mimu_canal_idx
  on public.conversas_mimu (empresa_id, canal, created_at desc);

-- ----------------------------------------------------------------------------
-- Marca as duas como aplicadas, para o CLI não tentar de novo
-- ----------------------------------------------------------------------------
insert into supabase_migrations.schema_migrations (version, name)
values
  ('20260831210000', 'cota_diaria_mimu'),
  ('20260901190000', 'canal_da_conversa')
on conflict (version) do nothing;

commit;

-- ============================================================================
-- Conferência — rode DEPOIS, separado
-- ============================================================================
--
-- select column_name from information_schema.columns
--  where table_name = 'conversas_mimu' and column_name = 'canal';
--   -> tem que devolver uma linha
--
-- select pg_get_constraintdef(oid) from pg_constraint
--  where conname = 'auth_rate_limit_tipo_check';
--   -> tem que incluir 'mimu_dia'
--
-- select count(*) from public.empresas where modulos_ativos @> array['ia'];
--   -> tem que ser >= o número de contas gratuitas
