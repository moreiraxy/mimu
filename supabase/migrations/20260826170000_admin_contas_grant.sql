-- Devolve a permissão de leitura da view para o servidor.
--
-- `drop view` descarta os grants junto, e a migration que recriou a view só
-- revogou de anon e authenticated, assumindo que o resto continuava. Não
-- continuava: a service_role ficou sem SELECT e o painel admin passou a
-- carregar vazio.
--
-- Erro meu, e do tipo que passa despercebido: a consulta não dá erro, devolve
-- zero linhas. Foi preciso comparar com a contagem de `empresas` para ver.
grant select on public.admin_contas to service_role;

-- anon e authenticated seguem de fora: a view junta auth.users com todas as
-- empresas, e quem lê é o servidor.
revoke all on public.admin_contas from anon, authenticated;
