-- Confere de hora em hora se a Mimu ainda responde.
--
-- A Groq aposentou o modelo sem avisar e a Mimu ficou muda por horas. Quem
-- descobriu foi uma cliente reclamando. O reserva automático resolve o caso de
-- o modelo sumir; não resolve o de ninguém ficar sabendo, e o próximo problema
-- pode ser outro: chave revogada, conta suspensa, limite estourado o dia todo.
--
-- De hora em hora e não a cada minuto: a checagem chama o modelo de verdade e
-- consome tokens do mesmo limite que atende as clientes. Uma hora é rápido o
-- bastante para você saber antes do seu cliente, e barato o bastante para não
-- competir com o uso real.

select cron.unschedule('mimu-saude')
where exists (select 1 from cron.job where jobname = 'mimu-saude');

select cron.schedule(
  'mimu-saude',
  '7 * * * *',  -- minuto 7 de cada hora, longe do topo onde todo agendador acorda
  $$
  select net.http_post(
    url := 'https://mimu.up.railway.app/api/cron/saude',
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
