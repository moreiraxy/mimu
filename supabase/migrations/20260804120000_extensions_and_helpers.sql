-- Extensões e funções auxiliares compartilhadas por todas as tabelas da Mimu.

create extension if not exists "pgcrypto" with schema public;

-- Atualiza updated_at automaticamente em qualquer tabela que tenha essa coluna.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- O helper de RLS user_owns_empresa() fica em 20260804120100_empresas.sql,
-- logo depois da tabela empresas ser criada — funções LANGUAGE SQL validam
-- as relações referenciadas no momento da criação (diferente de plpgsql),
-- então ele não pode existir antes da tabela que consulta.
