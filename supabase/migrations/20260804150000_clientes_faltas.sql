-- Contador de faltas do cliente, incrementado automaticamente sempre que um
-- agendamento dela muda para "nao_compareceu" — mesmo padrão da trigger
-- atualizar_cliente_fiel (20260804120200_clientes.sql): a regra fica no
-- banco pra valer não importa por onde a escrita aconteça.

alter table public.clientes
  add column faltas integer not null default 0;

comment on column public.clientes.faltas is
  'Quantidade de agendamentos marcados como "não compareceu".';

create or replace function public.incrementar_faltas_cliente()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'nao_compareceu'
     and old.status is distinct from 'nao_compareceu'
     and new.cliente_id is not null then
    update public.clientes
    set faltas = faltas + 1
    where id = new.cliente_id;
  end if;
  return new;
end;
$$;

create trigger trg_incrementar_faltas_cliente
  after update of status on public.agendamentos
  for each row
  execute function public.incrementar_faltas_cliente();
