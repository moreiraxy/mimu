-- Cria automaticamente a empresa de uma usuária assim que ela se cadastra no
-- Supabase Auth, lendo "nome_negocio" do user_metadata enviado no signUp().

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.empresas (user_id, nome)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome_negocio', 'Meu negócio')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
