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

-- Helper de RLS: verifica se a empresa informada pertence ao usuário autenticado.
-- security definer + search_path fixo para evitar hijacking de schema; stable
-- para permitir que o planner cacheie o resultado dentro da mesma query.
create or replace function public.user_owns_empresa(empresa_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.empresas e
    where e.id = empresa_id
      and e.user_id = auth.uid()
  );
$$;
