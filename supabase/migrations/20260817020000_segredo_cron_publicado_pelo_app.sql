-- Uma fonte de verdade só para o segredo da tarefa diária.
--
-- O segredo precisava bater em dois lugares escritos à mão: a variável
-- CRON_SECRET no Railway, que a rota lê, e o Vault do Supabase, de onde o
-- agendamento tira o cabeçalho. Trocar um sem o outro faz a tarefa responder
-- 404 todo dia, em silêncio, porque falhar fechado é justamente não contar
-- nada a quem chama. Foi exatamente o que aconteceu: a tarefa disparou no
-- horário, o SQL deu "succeeded", e a resposta HTTP guardada em
-- net._http_response era 404. Ninguém tinha por que olhar ali.
--
-- Agora quem manda é o Railway, e só ele. O app, ao subir, publica o próprio
-- CRON_SECRET aqui (veja instrumentation.ts). Mudou a variável e deu deploy?
-- O banco acompanha sozinho. Não existe mais o estado "os dois lados
-- discordam", porque só existe um lado.

create or replace function public.definir_segredo_cron(p_segredo text)
returns void
language plpgsql
security definer
-- search_path vazio: função SECURITY DEFINER roda com os poderes do dono, e
-- um schema plantado no caminho poderia sequestrar uma chamada não
-- qualificada. Por isso tudo abaixo vem com o schema escrito.
set search_path = ''
as $$
declare
  v_id uuid;
  v_nota text := 'Segredo compartilhado da tarefa diária de alertas. Publicado pelo app a cada boot; a fonte é a variável CRON_SECRET no Railway.';
begin
  -- Um segredo curto demais é quase certamente um engano de configuração, e
  -- gravá-lo trocaria uma falha barulhenta por uma porta fraca.
  if p_segredo is null or length(p_segredo) < 24 then
    raise exception 'Segredo do cron ausente ou curto demais (mínimo de 24 caracteres).';
  end if;

  select id into v_id from vault.secrets where name = 'mimu_cron_secret';

  if v_id is null then
    perform vault.create_secret(p_segredo, 'mimu_cron_secret', v_nota);
  else
    perform vault.update_secret(v_id, p_segredo, 'mimu_cron_secret', v_nota);
  end if;
end;
$$;

-- Só o servidor chama isto. Deixar em aberto daria a qualquer visitante do
-- site o poder de trocar o segredo da tarefa.
revoke all on function public.definir_segredo_cron(text) from public;
revoke all on function public.definir_segredo_cron(text) from anon;
revoke all on function public.definir_segredo_cron(text) from authenticated;
grant execute on function public.definir_segredo_cron(text) to service_role;
