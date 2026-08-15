-- Agenda a tarefa diária de alertas.
--
-- Antes, os alertas só nasciam quando alguém abria o app: quem gerava era o
-- navegador de quem estava usando a Mimu naquele momento. Na prática, só
-- recebia aviso quem já tinha entrado — o contrário do que um aviso serve.
--
-- Quem dispara agora é o próprio banco, todo dia, chamando a rota
-- /api/cron/alertas-diarios. Fica no Supabase e não num serviço à parte
-- porque ele já está de pé, já tem os dados, e um agendador a menos é uma
-- coisa a menos para quebrar sem ninguém perceber.

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- O segredo NÃO fica aqui. Esta migration vai para o Git, e um segredo em
-- arquivo versionado deixa de ser segredo. Ele mora no Vault do Supabase, e
-- a chamada abaixo o lê na hora de executar.
--
-- Para criar, uma única vez, no SQL Editor:
--   select vault.create_secret('<o valor de CRON_SECRET>', 'mimu_cron_secret');
--
-- Se o segredo não existir, a chamada sai sem o cabeçalho e a rota responde
-- 404 — falha fechada, sem disparar nada.

select cron.unschedule('mimu-alertas-diarios')
where exists (
  select 1 from cron.job where jobname = 'mimu-alertas-diarios'
);

-- 20:00 UTC = 17:00 em Brasília.
--
-- O horário é escolhido, não arbitrário: os alertas falam do dia que está
-- acabando ("hoje você ainda não registrou nenhuma venda", "você bateu seu
-- recorde"). De manhã não haveria o que dizer, e de madrugada o aviso chega
-- quando ninguém pode agir.
select cron.schedule(
  'mimu-alertas-diarios',
  '0 20 * * *',
  $$
  select net.http_post(
    url := 'https://mimu.up.railway.app/api/cron/alertas-diarios',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization',
      'Bearer ' || coalesce(
        (select decrypted_secret from vault.decrypted_secrets
          where name = 'mimu_cron_secret'),
        ''
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
