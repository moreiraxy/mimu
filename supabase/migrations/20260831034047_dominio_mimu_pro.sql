-- As tarefas agendadas passam a chamar mimu.pro.
--
-- O endereço do site mudou. As duas tarefas abaixo foram criadas com o
-- endereço antigo GRAVADO dentro delas — editar a migration original não
-- mudaria nada, porque ela já rodou. Elas continuariam batendo num site morto,
-- e sem avisar: tarefa agendada que falha não reclama com ninguém.

select cron.unschedule('mimu-saude')
where exists (select 1 from cron.job where jobname = 'mimu-saude');

select cron.schedule(
  'mimu-saude',
  '7 * * * *',
  $$
  select net.http_post(
    url := 'https://mimu.pro/api/cron/saude',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || coalesce(
        (select decrypted_secret from vault.decrypted_secrets
          where name = 'mimu_cron_secret'),
        ''
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

select cron.unschedule('mimu-alertas-diarios')
where exists (select 1 from cron.job where jobname = 'mimu-alertas-diarios');

-- Horário e timeout copiados da migration original (20260815120000): 20h, e
-- 120 segundos porque este varre todas as empresas, não uma chamada só.
-- Reagendar com valores "arredondados" mudaria a hora do aviso das clientes
-- sem ninguém pedir.
select cron.schedule(
  'mimu-alertas-diarios',
  '0 20 * * *',
  $$
  select net.http_post(
    url := 'https://mimu.pro/api/cron/alertas-diarios',
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
