-- Os avisos do posto passam a nascer NA HORA DA ROTINA.
--
-- "as notificações n estão funcionando, aaprecem quando elas querem" — e ela
-- descreveu o defeito com precisão. Os avisos eram gerados em três momentos,
-- todos ligados ao APP e nenhum ligado ao relógio dela:
--
--   1. quando ela abre o app;
--   2. a cada 30 minutos de app aberto;
--   3. cada vez que a aba volta ao foco (AlertasProvider).
--
-- Mais a tarefa diária das 17h, que varre todas as contas do produto.
--
-- Ou seja: o gatilho era o foco da aba. Abriu o app às 11h47, nasceram os
-- avisos às 11h47. Não abriu, não nasceu nada. "Quando elas querem" é
-- literalmente o que acontecia.
--
-- A ROTINA DELA TEM HORÁRIO, e é isso que esta migration usa:
--
--   09:30  e-mail, leads da noite e agenda do gerente
--   09:45  roleta da manhã
--   12:00  conferir quem foi cortado
--   14:45  roleta da tarde
--   17:00  varredura de SLA
--   17:45  resumo do dia para o gerente
--
-- Seis execuções, cinco minutos DEPOIS de cada marco. A folga de cinco minutos
-- é o que evita cobrar atraso de quem está em cima do horário.
--
-- POR QUE SEIS EXECUÇÕES NÃO VIRAM SEIS NOTIFICAÇÕES: a travessa de um aviso
-- por tipo por dia vive em lib/posto/alertas.ts. Sem ela, isto aqui seria uma
-- máquina de repetir a mesma frase — e foi exatamente a falta dela que fez os
-- avisos parecerem aleatórios até agora.
--
-- SEGUNDA A SEXTA (1-5). Sábado e domingo são "de casa, quando houver
-- necessidade": cobrar rotina no fim de semana seria cobrar um acordo que não
-- existe.
--
-- OS HORÁRIOS AQUI ESTÃO EM UTC, porque é o fuso em que o pg_cron do Supabase
-- roda. Brasília é UTC-3, então 9:35 daqui é 12:35 lá. Escrever 9:35 no cron
-- faria os avisos chegarem às 6:35 da manhã — e o primeiro deles seria sobre
-- um bloco que ainda não começou.

do $$
declare
  marco record;
  segredo_url text := 'https://mimu.pro/api/cron/posto';
begin
  for marco in
    select *
    from (values
      ('mimu-posto-0935', '35 12 * * 1-5'),  -- 09:35 BRT
      ('mimu-posto-0950', '50 12 * * 1-5'),  -- 09:50 BRT
      ('mimu-posto-1205', '5 15 * * 1-5'),   -- 12:05 BRT
      ('mimu-posto-1450', '50 17 * * 1-5'),  -- 14:50 BRT
      ('mimu-posto-1705', '5 20 * * 1-5'),   -- 17:05 BRT
      ('mimu-posto-1750', '50 20 * * 1-5')   -- 17:50 BRT
    ) as t(nome, agenda)
  loop
    -- Desagenda antes, para esta migration poder rodar duas vezes sem criar
    -- tarefa duplicada (que seria duas chamadas no mesmo minuto).
    if exists (select 1 from cron.job where jobname = marco.nome) then
      perform cron.unschedule(marco.nome);
    end if;

    perform cron.schedule(
      marco.nome,
      marco.agenda,
      format(
        $cmd$
        select net.http_post(
          url := %L,
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
          timeout_milliseconds := 30000
        );
        $cmd$,
        segredo_url
      )
    );
  end loop;
end $$;
