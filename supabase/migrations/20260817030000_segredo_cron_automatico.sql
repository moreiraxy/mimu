-- O segredo da tarefa diária deixa de ser configurado à mão.
--
-- Histórico curto do problema: o valor precisava ser digitado igual em dois
-- lugares (a variável CRON_SECRET no Railway e o Vault daqui). Deu errado três
-- vezes seguidas, e a última foi a mais reveladora: o que estava no Railway
-- era o próprio espaço reservado que eu tinha escrito na instrução, entre
-- sinais de menor e maior. Ninguém tinha como perceber, porque a rota falha
-- fechada por segurança e a tarefa só registrava "succeeded" (o SQL enfileira
-- a chamada com sucesso; o 404 ficava guardado em net._http_response).
--
-- A correção não é acertar o valor, é remover a necessidade de alguém acertar.
-- O segredo agora nasce aqui, sozinho, e mora só aqui. O app o lê pelo mesmo
-- caminho que o agendamento, então não existe mais "os dois lados discordam":
-- só existe um lado. A variável de ambiente deixa de ser usada.

-- Substitui a função anterior, que ainda dependia de alguém digitar o valor.
drop function if exists public.definir_segredo_cron(text);

create or replace function public.obter_segredo_cron()
returns text
language plpgsql
security definer
-- search_path vazio: função SECURITY DEFINER roda com os poderes do dono, e um
-- schema plantado no caminho poderia sequestrar uma chamada não qualificada.
set search_path = ''
as $$
declare
  v_id uuid;
  v_segredo text;
  v_nota text := 'Segredo da tarefa diária de alertas. Nasce sozinho e mora só aqui; ninguém precisa configurar.';
begin
  select id, decrypted_secret into v_id, v_segredo
  from vault.decrypted_secrets
  where name = 'mimu_cron_secret';

  -- Recusa o que não é segredo: curto demais, ou com cara de espaço reservado
  -- copiado de uma instrução (<algo assim>). Nos dois casos, gera um novo em
  -- vez de seguir com uma porta fraca ou quebrada.
  if v_segredo is null
     or length(v_segredo) < 32
     or v_segredo ~ '^<.*>$'
  then
    -- Dois UUIDs sem hífen dão 64 caracteres hexadecimais de aleatoriedade
    -- criptográfica. gen_random_uuid vem no próprio Postgres, então isto não
    -- depende de nenhuma extensão estar instalada.
    v_segredo := replace(pg_catalog.gen_random_uuid()::text, '-', '')
              || replace(pg_catalog.gen_random_uuid()::text, '-', '');

    if v_id is null then
      perform vault.create_secret(v_segredo, 'mimu_cron_secret', v_nota);
    else
      perform vault.update_secret(v_id, v_segredo, 'mimu_cron_secret', v_nota);
    end if;
  end if;

  return v_segredo;
end;
$$;

-- Só o servidor lê isto. Em aberto, qualquer visitante do site poderia pegar
-- o segredo e disparar a tarefa.
revoke all on function public.obter_segredo_cron() from public;
revoke all on function public.obter_segredo_cron() from anon;
revoke all on function public.obter_segredo_cron() from authenticated;
grant execute on function public.obter_segredo_cron() to service_role;
